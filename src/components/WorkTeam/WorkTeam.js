import React from 'react';
import PropTypes from 'prop-types';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import { defineMessages, FormattedMessage } from 'react-intl';
import s from './WorkTeam.css';
import Label from '../Label';
import Value from '../Value';
import Box from '../Box';
import Button from '../Button';
import DiscussionPreview from '../DiscussionPreview';
import history from '../../history';

const messages = defineMessages({
  join: {
    id: 'join',
    defaultMessage: 'Join',
    description: 'Button label',
  },
  pending: {
    id: 'join.pending',
    defaultMessage: 'Join request under evaluation',
    description: 'Join request pending',
  },
});

class WorkTeam extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    logo: PropTypes.string,
    name: PropTypes.string.isRequired,
    numMembers: PropTypes.number.isRequired,
    numDiscussions: PropTypes.number.isRequired,
    discussions: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
    ownStatus: PropTypes.string.isRequired,
    onJoinRequest: PropTypes.func.isRequired,
    updates: PropTypes.shape({ pending: PropTypes.bool }).isRequired,
  };
  static defaultProps = {
    logo: null,
  };
  constructor(props) {
    super(props);
    this.handleDiscussionClick = this.handleDiscussionClick.bind(this);
    this.handleJoining = this.handleJoining.bind(this);
  }
  // eslint-disable-next-line class-methods-use-this
  handleDiscussionClick({ discussionId }) {
    history.push(`${this.props.id}/discussions/${discussionId}`);
  }

  handleJoining() {
    const { ownStatus, onJoinRequest, id } = this.props;
    if (ownStatus === 'none') {
      const content = { id };
      onJoinRequest({ type: 'joinWT', content: JSON.stringify(content) });
    }
  }

  render() {
    const {
      logo,
      name,
      numMembers,
      numDiscussions,
      discussions,
      id,
      ownStatus,
      updates,
    } = this.props;
    let picture;
    if (logo) {
      picture = <img alt="Logo" className={s.logo} src={logo} />;
    } else {
      picture = (
        <svg
          className={s.logo}
          version="1.1"
          viewBox="0 0 24 24"
          role="img"
          width="192px"
          height="192px"
          aria-label="cloud"
        >
          <path
            fill="none"
            stroke="#000"
            strokeWidth="2"
            d="M18,17 L18,18 C18,21 16,22 13,22 L11,22 C8,22 6,21 6,18 L6,17 C3.23857625,17 1,14.7614237 1,12 C1,9.23857625 3.23857625,7 6,7 L12,7 M6,7 L6,6 C6,3 8,2 11,2 L13,2 C16,2 18,3 18,6 L18,7 C20.7614237,7 23,9.23857625 23,12 C23,14.7614237 20.7614237,17 18,17 L12,17"
          />
        </svg>
      );
    }

    let joinBtn;
    if (ownStatus === 'none') {
      joinBtn = (
        <Button
          onClick={this.handleJoining}
          disabled={updates && updates.pending}
          primary
          label={<FormattedMessage {...messages.join} />}
        />
      );
    } else if (ownStatus === 'pending') {
      joinBtn = <FormattedMessage {...messages.pending} />;
    }
    return (
      <div className={s.root}>
        {picture}
        <Label big>{name}</Label>
        <Box>
          <Value
            icon={
              <svg viewBox="0 0 24 24" width="24px" height="24px" role="img">
                <path
                  fill="none"
                  stroke="#000"
                  strokeWidth="2"
                  d="M12,13 C14.209139,13 16,11.209139 16,9 C16,6.790861 14.209139,5 12,5 C9.790861,5 8,6.790861 8,9 C8,11.209139 9.790861,13 12,13 Z M6,22 L6,19 C6,15.6862915 8.6862915,13 12,13 C15.3137085,13 18,15.6862915 18,19 L18,22 M13,5 C13.4037285,3.33566165 15.0151447,2 17,2 C19.172216,2 20.98052,3.790861 21,6 C20.98052,8.209139 19.172216,10 17,10 L16,10 L17,10 C20.287544,10 23,12.6862915 23,16 L23,18 M11,5 C10.5962715,3.33566165 8.98485529,2 7,2 C4.82778404,2 3.01948003,3.790861 3,6 C3.01948003,8.209139 4.82778404,10 7,10 L8,10 L7,10 C3.71245602,10 1,12.6862915 1,16 L1,18"
                />
              </svg>
            }
            label="Members"
            value={numMembers || 0}
          />
          <Value
            icon={
              <svg viewBox="0 0 24 24" width="24px" height="24px" role="img">
                <path
                  fill="none"
                  stroke="#000"
                  strokeWidth="2"
                  d="M12,13 C14.209139,13 16,11.209139 16,9 C16,6.790861 14.209139,5 12,5 C9.790861,5 8,6.790861 8,9 C8,11.209139 9.790861,13 12,13 Z M6,22 L6,19 C6,15.6862915 8.6862915,13 12,13 C15.3137085,13 18,15.6862915 18,19 L18,22 M13,5 C13.4037285,3.33566165 15.0151447,2 17,2 C19.172216,2 20.98052,3.790861 21,6 C20.98052,8.209139 19.172216,10 17,10 L16,10 L17,10 C20.287544,10 23,12.6862915 23,16 L23,18 M11,5 C10.5962715,3.33566165 8.98485529,2 7,2 C4.82778404,2 3.01948003,3.790861 3,6 C3.01948003,8.209139 4.82778404,10 7,10 L8,10 L7,10 C3.71245602,10 1,12.6862915 1,16 L1,18"
                />
              </svg>
            }
            label="Discussions"
            value={numDiscussions || 0}
          />
        </Box>
        <Button
          onClick={() => {
            history.push(`/workteams/${id}/admin`);
          }}
          primary
          label={'Management'}
        />
        {joinBtn}
        <div className={s.discussions}>
          {discussions &&
            discussions.map(
              d =>
                d && (
                  <DiscussionPreview
                    discussion={d}
                    onClick={this.handleDiscussionClick}
                  />
                ),
            )}
        </div>
      </div>
    );
  }
}

export default withStyles(s)(WorkTeam);
