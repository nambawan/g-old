// @flow

import knex from '../knex';
import { canSee, canMutate, Models } from '../../core/accessControl';
import EventManager from '../../core/EventManager';
import Note from './Note';
import Communication from './Communication';
import log from '../../logger';
import createLoaders from '../../data/dataLoader';

export type MessageType = 'communication' | 'note' | 'meeting';

type RecipientType = 'user' | 'group';
class Message {
  recipientType: RecipientType;
  id: ID;
  messageHtml: string;
  subject: string;
  senderId: ID;
  messageType: MessageType;
  objectId: ID;
  recipients: [ID];
  msg: string;
  createdAt: string;
  message: string;
  enforceEmail: boolean;
  constructor(data) {
    this.id = data.id;
    this.recipientType = data.recipient_type;
    this.messageType = data.message_type;
    this.objectId = data.message_object_id;
    this.enforceEmail = data.enforce_email;
    this.recipients = data.recipients;
    this.subject = data.subject;
    this.senderId = data.sender_id;
    this.createdAt = data.created_at;
  }

  static async gen(viewer, id) {
    const [data = null] = await knex('messages')
      .where({ id })
      .select();
    if (!data) return null;
    return canSee(viewer, data, Models.MESSAGE) ? new Message(data) : null;
  }

  static async create(viewer, data, loaders, trx) {
    if (!data) {
      return null;
    }
    if (!canMutate(viewer, data, Models.MESSAGE)) return null;
    let messageData;
    const newData = { created_at: new Date(), sender_id: viewer.id };

    if (data.recipientType) {
      newData.recipient_type = data.recipientType;
    }
    if (data.recipients) {
      if (data.recipients.length || data.recipientType === 'all') {
        newData.recipients = JSON.stringify(data.recipients || []);
      } else {
        throw new Error('Atleast one recipient required');
      }
    }
    if (data.subject) {
      newData.subject = data.subject;
    }

    if (data.enforceEmail) {
      newData.enforce_email = true;
    }

    if (trx) {
      messageData = await knex('messages')
        .transacting(trx)
        .insert(newData)
        .returning('*');
    } else {
      await knex.transaction(async tra => {
        let object = {};
        if (data.messageType === 'note') {
          if (data.note.id) {
            object = await Note.gen(viewer, data.note.id, loaders);
          } else {
            object = await Note.create(viewer, data.note, loaders, tra);
          }
        } else if (data.messageType === 'communication') {
          object = await Communication.create(
            viewer,
            data.communication,
            loaders,
            tra,
          );
        }

        newData.message_object_id = object.id;
        if (!newData.message_object_id) {
          throw new Error('Object id cannot be null');
        }

        newData.message_type = data.messageType;
      });

      [messageData = null] = await knex('messages')
        .insert(newData)
        .returning('*');
    }

    const message = messageData ? new Message(messageData) : null;
    if (message) {
      EventManager.publish('onMessageCreated', {
        viewer,
        message: {
          ...message,
          targetType: message.recipientType,
          messageType: message.messageType,
          objectId: message.objectId,
        },
        subjectId: message.recipients[0],
      });
    }
    return message;
  }
}

export default Message;

const helpNotice = {
  de:
    'Wenn Sie glauben, dass hier ein Fehler vorliegt, schreiben Sie eine E-Mail an xxx@xxx.xx',
  it:
    'Wenn Sie glauben, dass hier ein Fehler vorliegt, schreiben Sie eine E-Mail an xxx@xxx.xx',
  lld:
    'Wenn Sie glauben, dass hier ein Fehler vorliegt, schreiben Sie eine E-Mail an xxx@xxx.xx',
};

const userStatusTranslations = {
  subject: {
    added: {
      de: 'Neue Rechte erhalten!',
      it: 'translate:Neue Rechte erhalten!',
      lld: 'tranlate: Neue Rechte erhalten!',
    },
    lost: {
      de: 'Achtung, sie haben eine Berechtigung verloren!',
      it: 'translate:Achtung, sie haben eine Berechtigung verloren!',
      lld: 'translate: Achtung, sie haben eine Berechtigung verloren!',
    },
  },
  viewer_added: {
    de:
      'Sie sind als Viewer freigeschalten worden. Ab sofort können Sie einer Arbeitsgruppe beitreten, bei Umfragen abstimmen und Beiträge, Beschlüsse sowie Diskussionen lesen.',
    it:
      'translate: Sie sind als Viewer freigeschalten worden. Ab sofort können Sie einer Arbeitsgruppe beitreten, bei Umfragen abstimmen und Beiträge, Beschlüsse sowie Diskussionen lesen.',
    lld:
      'translate: Sie sind als Viewer freigeschalten worden. Ab sofort können Sie einer Arbeitsgruppe beitreten, bei Umfragen abstimmen und Beiträge, Beschlüsse sowie Diskussionen lesen.',
  },
  viewer_lost: {
    de: `Sie besitzen nun nicht mehr die Berechtigungen eines Viewers. Bis auf weiteres können Sie an keinen Aktivitäten der Plattformen teilnehmen. ${
      helpNotice.de
    }`,
    it: `translate: Sie besitzen nun nicht mehr die Berechtigungen eines Viewers. Bis auf weiteres können Sie an keinen Aktivitäten der Plattformen teilnehmen. ${
      helpNotice.it
    }`,
    lld: `translate: Sie besitzen nun nicht mehr die Berechtigungen eines Viewers. Bis auf weiteres können Sie an keinen Aktivitäten der Plattformen teilnehmen. ${
      helpNotice.lld
    }`,
  },

  voter_added: {
    de:
      'Sie sind als Voter freigschalten worden. Ab sofort sind Sie uneingeschränktes Mitglied und können  an allen Abstimmungen teilnehmen, sowie Kommentare und Erklärungen verfassen.',
    it:
      'translate: Sie sind als Voter freigschalten worden. Ab sofort sind Sie uneingeschränktes Mitglied und können  an allen Abstimmungen teilnehmen, sowie Kommentare und Erklärungen verfassen.',
    lld:
      'translate: Sie sind als Voter freigschalten worden. Ab sofort sind Sie uneingeschränktes Mitglied und können  an allen Abstimmungen teilnehmen, sowie Kommentare und Erklärungen verfassen.',
  },
  voter_lost: {
    de: `Sie sind ab jetzt kein stimmberechtigtes Mitglied der Plattform. ${
      helpNotice.de
    }`,
    it: `translate: Sie sind ab jetzt kein stimmberechtigtes Mitglied der Plattform. ${
      helpNotice.it
    }`,
    lld: `translate: Sie sind ab jetzt kein stimmberechtigtes Mitglied der Plattform. ${
      helpNotice.lld
    }`,
  },

  moderator_added: {
    de:
      'Sie sind als Moderator freigeschalten worden. Ab sofort können Sie Kommentare und Erklärungen löschen.',
    it:
      'translate: Sie sind als Moderator freigeschalten worden. Ab sofort können Sie Kommentare und Erklärungen löschen.',
    lld:
      'translate: Sie sind als Moderator freigeschalten worden. Ab sofort können Sie Kommentare und Erklärungen löschen.',
  },
  moderator_lost: {
    de: `Sie sind ab jetzt kein Moderator mehr. ${helpNotice.de}`,
    it: `translate: Sie sind ab jetzt kein Moderator mehr. ${helpNotice.it}`,
    lld: `translate: Sie sind ab jetzt kein Moderator mehr. ${helpNotice.lld}`,
  },

  member_manager_added: {
    de:
      'Sie sind als "Member Manager" freigeschalten worden. Ab sofort können sie andere Benutzer freischalten.',
    it:
      'translate: Sie sind als "Member Manager" freigeschalten worden. Ab sofort können sie andere Benutzer freischalten.',
    lld:
      'translate: Sie sind als "Member Manager" freigeschalten worden. Ab sofort können sie andere Benutzer freischalten.',
  },

  member_manager_lost: {
    de: `Sie sind ab jetzt kein "Member Manager" mehr. ${helpNotice.de}`,
    it: `translate: Sie sind ab jetzt kein "Member Manager" mehr. ${
      helpNotice.it
    }`,
    lld: `translate: Sie sind ab jetzt kein "Member Manager" mehr. ${
      helpNotice.lld
    }`,
  },
};

EventManager.subscribe('onUserUpdated', async ({ user, viewer }) => {
  try {
    const keyword = `${user.diff[0].toLowerCase()}_${
      user.added ? 'added' : 'lost'
    }`;
    const loaders = createLoaders();
    let note;
    if (user && user.changedField === 'groups') {
      [note = null] = await knex('notes')
        .where({ category: 'groups', keyword })
        .select();

      if (!note) {
        // insert

        const textHtml = userStatusTranslations[keyword]; // import from JSON
        if (textHtml) {
          note = await Note.create(
            viewer,
            { textHtml, category: 'groups', keyword },
            loaders,
          );
        }
      }
      if (!note) {
        throw new Error('Note not found');
      }

      await Message.create(
        viewer,
        {
          subject:
            userStatusTranslations.subject[user.added ? 'added' : 'lost'],
          sender: viewer,
          messageType: 'note',
          recipientType: 'user',
          recipients: [user.id],
          enforceEmail: user.added,
          note: { id: note.id },
        },
        loaders,
      );
    }
  } catch (err) {
    log.error(
      {
        err,
        userId: user.id,
        field: user.changedField,
        diff: (user.diff && user.diff.join()) || '-missing-',
      },
      'Adding status message failed',
    );
  }
});
