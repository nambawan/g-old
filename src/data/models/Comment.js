// @flow
import knex from '../knex';
import { canSee, canMutate, Models } from '../../core/accessControl';
import EventManager from '../../core/EventManager';

type ID = string | number;
export type CommentProps = {
  id: ID,
  author_id: ID,
  discussion_id: ID,
  content: string,
  parent_id: ID,
  num_replies: number,
  created_at: string,
  updated_at: string,
  edited_at: string,
};

const MAX_CONTENT_LENGTH = 10000;
class Comment {
  id: ID;

  authorId: ID;

  discussionId: ID;

  content: string;

  parentId: ID;

  numReplies: number;

  createdAt: string;

  updatedAt: string;

  editedAt: string;

  constructor(data: CommentProps) {
    this.id = data.id;
    this.authorId = data.author_id;
    this.discussionId = data.discussion_id;
    this.content = data.content;
    this.parentId = data.parent_id;
    this.numReplies = data.num_replies;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    this.editedAt = data.edited_at;
  }

  static async gen(viewer, id, { comments, discussions }) {
    if (!id) return null;
    const data = await comments.load(id);
    if (data == null) return null;
    if (viewer.id == null) return null;
    const discussion = await discussions.load(data.discussion_id);
    if (
      !canSee(
        viewer,
        { ...data, discussion: { workTeamId: discussion.work_team_id } },
        Models.COMMENT,
      )
    )
      return null;

    return new Comment(data);
  }

  static async create(viewer, data, loaders) {
    if (!data || !data.discussionId) return null;
    const discussion = await loaders.discussions.load(data.discussionId);
    if (!discussion) {
      return null;
    }
    if (
      !canMutate(
        viewer,
        {
          ...data,
          discussion: {
            workTeamId: discussion.work_team_id,
            closedAt: discussion.closed_at,
          },
          creating: true,
        },
        Models.COMMENT,
      )
    ) {
      return null;
    }

    let workTeamId;
    const commentInDB = await knex.transaction(async trx => {
      const content = data.content.substring(0, MAX_CONTENT_LENGTH);

      const [comment = null] = await knex('comments')
        .transacting(trx)
        .insert({
          author_id: viewer.id,
          content: content.trim(),
          discussion_id: data.discussionId,
          parent_id: data.parentId,
          created_at: new Date(),
        })
        .returning('*');

      if (comment) {
        [workTeamId] = await knex('discussions')
          .where({ id: data.discussionId })
          .transacting(trx)
          .forUpdate()
          .increment('num_comments', 1)
          .returning('work_team_id');

        if (comment.parent_id) {
          await knex('comments')
            .where({ id: comment.parent_id })
            .transacting(trx)
            .forUpdate()
            .increment('num_replies', 1);
        }
      }
      return comment;
    });

    const comment = commentInDB ? new Comment(commentInDB) : null;
    if (comment && workTeamId) {
      EventManager.publish('onCommentCreated', {
        viewer,
        comment,
        subjectId: data.discussionId,
        groupId: workTeamId,
        info: { workTeamId },
      });
    }

    return comment;
  }

  static async update(viewer, data, { comments, discussions }) {
    if (!data || !data.id || !data.content) return null;
    const oldComment = await comments.load(data.id);
    const discussion = await discussions.load(oldComment.discussion_id);

    if (
      !canMutate(
        viewer,
        {
          ...data,
          authorId: oldComment.author_id,
          discussion: { closedAt: discussion.closed_at },
        },
        Models.COMMENT,
      )
    )
      return null;
    const commentInDB = await knex.transaction(async trx => {
      const content = data.content.substring(0, MAX_CONTENT_LENGTH);
      const now = new Date();
      const [comment = null] = await knex('comments')
        .where({ id: data.id })
        .transacting(trx)
        .forUpdate()
        .update({
          content: content.trim(),
          edited_at: now,
          updated_at: now,
        })
        .returning('*');
      if (comment) {
        comments.clear(data.id);
      }

      return comment;
    });
    return commentInDB ? new Comment(commentInDB) : null;
  }

  static async delete(viewer, data, { comments, discussions }) {
    if (!data || !data.id) return null;
    const oldComment = await comments.load(data.id);
    const discussion = await discussions.load(oldComment.discussion_id);
    if (
      !canMutate(
        viewer,
        {
          ...data,
          delete: true,
          authorId: oldComment.author_id,
          discussion: { closedAt: discussion.closed_at },
        },
        Models.COMMENT,
      )
    ) {
      return null;
    }

    let workTeamId;
    let replyIds;
    const commentInDB = await knex.transaction(async trx => {
      // search for replies - pass ids as eventprops;

      const statusOK = await knex('comments')
        .where({ id: data.id })
        .transacting(trx)
        .forUpdate()
        .del();

      if (oldComment.parent_id) {
        await knex('comments')
          .where({ id: oldComment.parent_id })
          .transacting(trx)
          .forUpdate()
          .decrement('num_replies', 1);
        [workTeamId = null] = await knex('discussions')
          .where({ id: oldComment.discussion_id })
          .transacting(trx)
          .forUpdate()
          .decrement('num_comments', 1)
          .returning('work_team_id'); // TODO check if correct
      } else {
        // probably has replies
        replyIds = await knex('comments')
          .where({ parent_id: oldComment.id })
          .pluck('id');

        [workTeamId = null] = await knex('discussions')
          .where({ id: oldComment.discussion_id })
          .transacting(trx)
          .forUpdate()
          .decrement('num_comments', oldComment.num_replies + 1)
          .returning('work_team_id'); // TODO check if correct
      }

      if (statusOK) {
        comments.clear(data.id);
        return oldComment;
      }
      return statusOK;
    });
    const comment = commentInDB ? new Comment(commentInDB) : null;
    if (comment && workTeamId) {
      EventManager.publish('onCommentDeleted', {
        viewer,
        comment: { ...comment, replyIds },
        subjectId: data.discussionId,
        groupId: workTeamId,
        info: { workTeamId, replyIds },
      });
    }
    return comment;
  }
}

export default Comment;
