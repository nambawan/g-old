import { GraphQLInt, GraphQLString, GraphQLID, GraphQLBoolean } from 'graphql';

/* eslint-disable import/no-cycle */
import ProposalType from '../types/ProposalDLType';
/* eslint-enable import/no-cycle */
import { createConnection } from '../utils';
import Proposal from '../models/Proposal';
import knex from '../knex';

const allProposals = createConnection(
  ProposalType,
  Proposal,
  async (viewer, { cursorDate, cursorId, batchSize = 10 }, args) => {
    if (args.tagId) {
      /*
      select proposals.id from proposals join (select proposal_tags.proposal_id from proposal_tags where proposal_tags.tag_id =5)as tt on proposals.id = tt.proposal_id;

      */
      return knex(
        knex.raw(
          'proposals join (select proposal_tags.proposal_id from proposal_tags where proposal_tags.tag_id = ?)as tt on proposals.id = tt.proposal_id',
          [args.tagId],
        ),
      )
        .where({ work_team_id: args.workteamId || null })
        .whereRaw('(proposals.created_at, proposals.id) < (?,?)', [
          cursorDate,
          cursorId,
        ])
        .limit(batchSize)
        .orderBy('proposals.created_at', 'desc')
        .orderBy('proposals.id', 'desc')
        .select('proposals.id as id', 'proposals.created_at as time');
    }
    let proposals;
    switch (args.state) {
      case 'active': {
        proposals = await knex('proposals')
          .innerJoin('polls', function() {
            this.on(function() {
              this.on(
                knex.raw(
                  "proposals.poll_two_id = polls.id and proposals.state = 'voting'",
                  /*  "(proposals.state = 'proposed' and proposals.poll_one_id = polls.id) or proposals.state = 'voting' and proposals.poll_two_id = polls.id", */
                ),
              );
            });
          })
          //  .where({ 'polls.closed_at': null }) TODO find some other way to p1 to p2 transitioning

          .where({
            work_team_id: args.workteamId || null,
            'proposals.deleted_at': null,
          })
          .modify(queryBuilder => {
            if (args.approvalState) {
              queryBuilder.where({ approval_state: args.approvalState });
            }
          })
          .whereRaw('(polls.end_time, polls.id) > (?,?)', [
            cursorDate,
            cursorId,
          ])
          .limit(batchSize)
          .orderBy('polls.end_time', 'asc')
          .orderBy('polls.id', 'asc')
          .select('proposals.id as id', 'polls.end_time as time');

        break;
      }

      case 'accepted': {
        proposals = await knex('proposals')
          .innerJoin('polls', function() {
            this.on(function() {
              this.on(
                knex.raw(
                  'coalesce (proposals.poll_two_id, proposals.poll_one_id) = polls.id',
                ),
              );
            });
          })

          .where({ work_team_id: args.workteamId || null })
          .modify(queryBuilder => {
            if (args.approvalState) {
              queryBuilder.where({ approval_state: args.approvalState });
            }
          })
          .where('proposals.state', '=', 'accepted')
          .whereRaw('(polls.end_time, polls.id) < (?,?)', [
            cursorDate,
            cursorId,
          ])
          .limit(batchSize)
          .orderBy('polls.end_time', 'desc')
          .select('proposals.id as id', 'polls.closed_at as time');
        break;
      }

      case 'repelled': {
        proposals = await knex('proposals')
          .innerJoin('polls', function() {
            this.on(function() {
              this.on(
                knex.raw(
                  "(proposals.state = 'revoked' and proposals.poll_one_id = polls.id) or proposals.state = 'rejected' and proposals.poll_two_id = polls.id",
                ),
              );
            });
          })
          .where({ work_team_id: args.workteamId || null })
          .whereRaw('(polls.closed_at, polls.id) < (?,?)', [
            cursorDate,
            cursorId,
          ])
          .limit(batchSize)
          .orderBy('polls.closed_at', 'desc')
          .select('proposals.id as id', 'polls.closed_at as time');
        break;
      }
      case 'survey': {
        proposals = await knex('proposals')
          .innerJoin('polls', 'proposals.poll_one_id', 'polls.id')
          .where({ work_team_id: args.workteamId || null })
          .where('proposals.state', '=', 'survey')
          .modify(queryBuilder => {
            if (args.closed) {
              queryBuilder.whereNotNull('polls.closed_at');
            } else {
              queryBuilder.whereNull('polls.closed_at');
            }
          })
          .whereRaw('(polls.end_time, polls.id) > (?,?)', [
            cursorDate,
            cursorId,
          ])
          .limit(batchSize)
          .orderBy('polls.end_time', 'asc')
          .select('proposals.id as id', 'polls.end_time as time');
        break;
      }
      case 'pending': {
        // Hack to load relevant proposals for mainteam - all accepted proposals of other workteams

        proposals = await knex('proposals')
          .innerJoin('polls', function() {
            this.on(function() {
              this.on(
                knex.raw(
                  'coalesce (proposals.poll_two_id, proposals.poll_one_id) = polls.id',
                ),
              );
            });
          })
          .whereNot({ work_team_id: args.workteamId })
          .whereNotNull('work_team_id')
          .whereNull('proposals.deleted_at')
          .where('proposals.state', '=', 'accepted')
          .whereRaw('(polls.end_time, polls.id) < (?,?)', [
            cursorDate,
            cursorId,
          ])
          .limit(batchSize)
          .orderBy('polls.end_time', 'desc')
          .select('proposals.id as id', 'polls.closed_at as time');
        break;
      }
      default:
        proposals = await knex('proposals')
          .innerJoin('polls', function() {
            this.on(function() {
              this.on(
                knex.raw(
                  'coalesce (proposals.poll_two_id, proposals.poll_one_id) = polls.id',
                ),
              );
            });
          })
          .where({ work_team_id: args.workteamId || null })
          .modify(queryBuilder => {
            if (args.approvalState) {
              queryBuilder.where({ approval_state: args.approvalState });
            }
          })
          .whereRaw('(polls.end_time, polls.id) < (?,?)', [
            cursorDate,
            cursorId,
          ])
          .limit(batchSize)
          .orderBy('polls.end_time', 'desc')
          .select('proposals.id as id', 'polls.closed_at as time');
    }
    return proposals;
  },
  {
    state: {
      type: GraphQLString,
    },
    tagId: {
      type: GraphQLID,
    },
    workteamId: {
      type: GraphQLID,
    },
    closed: {
      type: GraphQLBoolean,
    },
    approvalState: {
      type: GraphQLInt,
    },
  },
);

export default allProposals;
