// @flow
import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage } from 'react-intl';

import Box from '../Box';
import FormField from '../FormField';
import Button from '../Button';
import FormValidation from '../FormValidation';
import InputMask from './InputMask';
import LocaleSelector from './LocaleSelector';

const messages = defineMessages({
  notify: {
    id: 'account.notify',
    defaultMessage: 'Notify user',
    description: 'Contact user',
  },

  empty: {
    id: 'form.error-empty',
    defaultMessage: "You can't leave this empty",
    description: 'Help for empty fields',
  },
});
class MessageInput extends React.Component {
  static propTypes = {
    receiverId: PropTypes.string.isRequired,
    notifyUser: PropTypes.func.isRequired,
    updates: PropTypes.shape({
      pending: PropTypes.bool,
    }).isRequired,
    notifyGroup: PropTypes.bool,
    recipients: PropTypes.arrayOf(PropTypes.string),
    recipientType: PropTypes.oneOfType(['USER', 'GROUP']).isRequired,
    messageType: PropTypes.oneOfType(['COMMUNICATION', 'NOTE']).isRequired,
    parentId: PropTypes.string,
  };

  static defaultProps = {
    notifyGroup: null,
    recipients: null,
    parentId: null,
  };
  constructor(props) {
    super(props);
    this.onNotify = this.onNotify.bind(this);
    this.state = {
      data: {
        textde: { rawInput: '', html: '' },
        textit: { rawInput: '', html: '' },
        subjectde: '',
        subjectit: '',
        recipients: [],
      },
      activeLocale: 'de',
    };
    this.handleLanguageSelection = this.handleLanguageSelection.bind(this);
  }

  componentWillReceiveProps({ updates }) {
    if (updates && updates.success) {
      this.setState({
        data: {
          textde: { rawInput: '', html: '' },
          textit: { rawInput: '', html: '' },
          subjectde: '',
          subjectit: '',
          recipients: [],
        },
      });
    }
  }

  onNotify(values) {
    const subject = { de: values.subjectde, it: values.subjectit };
    const { recipients, recipientType, messageType, parentId } = this.props;

    const object = {};
    if (messageType === 'NOTE') {
      object.note = {
        textHtml: {
          ...(values.textde && { de: values.textde.html }),
          ...(values.textit && { de: values.textit.html }),
        },
        category: 'CIRCULAR',
      };
    } else if (messageType === 'COMMUNICATION') {
      object.communication = {
        parentId,
        textHtml: values.textde.html,
        replyable: true,
      };
    }
    this.props.notifyUser({
      recipientType,
      messageType,
      ...object,
      recipients,
      subject,
    });
  }

  handleLanguageSelection(locale) {
    this.setState({ activeLocale: locale });
  }

  render() {
    const { updates = {}, recipients = [], messageType } = this.props;
    const { activeLocale } = this.state;
    return (
      <FormValidation
        updatePending={updates && updates.pending}
        validations={{
          textit: {},
          textde: {},
          subjectde: {},
          subjectit: {},
          recipients: {},
        }}
        submit={this.onNotify}
        data={this.state.data}
      >
        {({ values, handleValueChanges, onSubmit, onBlur, errorMessages }) => (
          <Box column>
            <fieldset>
              {!recipients.length && (
                <FormField label="Receivers">
                  <input
                    name="receivers"
                    type="text"
                    onBlur={onBlur}
                    value={values.receivers}
                    onChange={handleValueChanges}
                  />
                </FormField>
              )}
              {messageType === 'COMMUNICATION' && (
                <InputMask
                  locale="de"
                  values={values}
                  handleValueChanges={handleValueChanges}
                  errors={errorMessages}
                />
              )}
              {messageType === 'NOTE' && (
                <div>
                  <LocaleSelector
                    activeLocale={activeLocale}
                    onActivate={this.handleLanguageSelection}
                    locales={['de', 'it']}
                  />
                  <InputMask
                    locale={activeLocale}
                    values={values}
                    handleValueChanges={handleValueChanges}
                    errors={errorMessages}
                  />
                </div>
              )}
            </fieldset>
            <Button
              fill
              primary
              onClick={onSubmit}
              pending={this.props.updates && this.props.updates.pending}
              label={<FormattedMessage {...messages.notify} />}
            />
          </Box>
        )}
      </FormValidation>
    );
  }
}

export default MessageInput;
