/* @flow */
import React from 'react';
import { connect } from 'react-redux';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import { concatDateAndTime, utcCorrectedDate } from '../../core/helpers';
import StepPage from '../StepPage';
import s from './ProposalInput.css';
import Box from '../Box';
import Wizard from '../Wizard';
import Steps from '../Steps';
import Step from '../Steps/Step';
import Meter from '../Meter';
import PollType from './PollType';
import ProposalBody from './ProposalBody';
import OptionInput from './OptionInput';
import DateInput from './DateInput';
import TagInput, { TAG_ID_SUFFIX } from './TagInput';
import SpokesmanInput from './SpokesmanInput';
import InputPreview from './InputPreview';
import { createProposal } from '../../actions/proposal';
import { findUser } from '../../actions/user';
import type { TagType } from '../TagInput';
import ResultPage from './ResultPage';
import Navigation from './Navigation';

import {
  getTags,
  getProposalUpdates,
  getVisibleUsers,
  getSessionUser,
} from '../../reducers';
import { isAdmin } from '../../organization';

export type Callback = (string, () => boolean) => boolean;
export type ValueType = { name: string, value: any };
export type PollTypeTypes = 'proposed' | 'voting' | 'survey';
type LocalisationShape = {
  de?: string,
  it?: string,
  lld: ?string,
  _default?: string,
};
export type PollSettingsShape = {
  withStatements?: boolean,
  secret?: boolean,
  threshold?: number,
  thresholdRef?: 'all' | 'voters',
  unipolar?: boolean,
};
export type OptionShape = { id: ID, description: LocalisationShape };
type State = {
  ...PollSettingsShape,
  dateTo?: string,
  timeTo?: string,
  body: string,
  title: string,

  spokesman: UserShape,
  pollType: { value: PollTypeTypes, label: string },
  options: OptionShape[],
  tags: TagType[],
};
type Props = {
  defaultPollType: PollTypeTypes,
  user: UserShape,
  createProposal: ({ workTeamId?: ID, ...State }) => Promise<boolean>,
  tags: TagType[],
  users: UserShape[],
  findUser: () => Promise<boolean>,
  workTeamId?: ID,
};

class ProposalInput extends React.Component<Props, State> {
  static defaultProps = {
    workTeamId: null,
  };

  constructor(props) {
    super(props);
    this.state = {
      options: [],
      pollType:
        props.availablePolls.find(
          poll => poll.value === props.defaultPollType,
        ) || props.availablePolls[0],
      spokesman: props.user,
      tags: [],
      dateTo: '',
      timeTo: '',
      ...props.defaultPollSettings[props.defaultPollType || 'proposed'],
    };

    this.handleAddOption = this.handleAddOption.bind(this);
    this.handleValueSaving = this.handleValueSaving.bind(this);
    this.handleSubmission = this.handleSubmission.bind(this);
    this.calculateNextStep = this.calculateNextStep.bind(this);
  }

  getNewTags() {
    const { tags: selectedTags } = this.state;

    return selectedTags.map(
      tag =>
        tag.id && tag.id.indexOf(TAG_ID_SUFFIX) !== -1
          ? { text: tag.text }
          : { id: tag.id },
    );
  }

  handleAddOption: OptionShape => void;

  handleValueSaving: (ValueType[]) => void;

  handleSubmission: () => void;

  calculateNextStep: () => void;

  handleAddOption(option: OptionShape) {
    this.setState(({ options }) => ({ options: [...options, option] }));
  }

  handleValueSaving(data) {
    const newData = data.reduce((acc, curr) => {
      acc[curr.name] = curr.value;
      return acc;
    }, {});
    this.setState(newData);
  }

  calculateNextStep({ step, push }) {
    switch (step.id) {
      case 'body': {
        const { pollType } = this.state;
        push(pollType.value === 'survey' ? 'options' : 'spokesman');
        break;
      }

      default:
        push();
        break;
    }
  }

  handleSubmission() {
    const { createProposal: create, workTeamId } = this.props;
    const startTime = null;
    let endTime = null;
    const {
      dateTo,
      timeTo,
      body,
      title,
      withStatements,
      secret,
      threshold,
      thresholdRef,
      unipolar,
      spokesman,
      pollType,
      options,
    } = this.state;

    if (dateTo || timeTo) {
      const date = dateTo || utcCorrectedDate(3).slice(0, 10);
      const time = timeTo || utcCorrectedDate().slice(11, 16);

      endTime = concatDateAndTime(date, time);
    }

    const newTags = this.getNewTags();

    const spokesmanId = spokesman ? spokesman.id : null;

    create({
      ...(workTeamId && { workTeamId }),
      title: title.trim(),
      text: body,
      state: pollType.value,
      poll: {
        options: options.map((o, i) => ({
          description: { de: o.description },
          pos: i,
          order: i,
        })),
        extended: !!options.length,
        startTime,
        endTime,
        secret,
        threshold,
        mode: {
          withStatements,
          unipolar,
          thresholdRef,
        },
      },
      ...(newTags.length ? { tags: newTags } : {}),
      spokesmanId,
    });
    return true;
  }

  reset() {
    const { user, defaultPollType, availablePolls } = this.props;
    this.setState({
      options: [],
      pollType:
        availablePolls.find(poll => poll.value === defaultPollType) ||
        availablePolls[0],
      spokesman: user,
      tags: [],
      dateTo: '',
      timeTo: '',
      title: '',
      body: '<p></p>',
    });
  }

  render() {
    const {
      options,
      pollType,
      body,
      title,
      spokesman,
      dateTo,
      timeTo,
      tags: selectedTags,
      secret,
      unipolar,
      withStatements,
      threshold,
      thresholdRef,
    } = this.state;
    const {
      users,
      user,
      tags,
      findUser: fetchUser,
      availablePolls,
      defaultPollSettings,
      updates = {},
    } = this.props;

    return (
      <Box column>
        Proposal WIZARD
        <Wizard onNext={this.calculateNextStep} basename="">
          {({ steps, step, push }) => (
            <StepPage>
              <Meter
                strokeWidth={1}
                percent={((steps.indexOf(step) + 1) / steps.length) * 100}
              />
              <Steps>
                <Step id="poll">
                  <PollType
                    availablePolls={availablePolls}
                    defaultPollSettings={defaultPollSettings}
                    data={{
                      pollType,
                      secret,
                      unipolar,
                      withStatements,
                      threshold,
                      thresholdRef,
                    }}
                    onExit={this.handleValueSaving}
                    advancedModeOn={isAdmin(user)}
                  />
                </Step>
                <Step id="body">
                  <ProposalBody
                    data={{ body, title }}
                    onExit={this.handleValueSaving}
                  />
                </Step>

                <Step id="options">
                  <OptionInput
                    data={options}
                    onExit={this.handleValueSaving}
                    onAddOption={this.handleAddOption}
                  />
                </Step>

                <Step id="spokesman">
                  <SpokesmanInput
                    onExit={this.handleValueSaving}
                    data={spokesman}
                    users={users}
                    onFetchUser={fetchUser}
                  />
                </Step>
                <Step id="date">
                  <DateInput
                    onExit={this.handleValueSaving}
                    data={{ timeTo, dateTo }}
                  />
                </Step>
                <Step id="tags">
                  <TagInput
                    suggestions={tags}
                    selectedTags={selectedTags}
                    maxTags={8}
                    onExit={this.handleValueSaving}
                  />
                </Step>
                <Step id="preview">
                  <InputPreview
                    {...this.state}
                    onExit={this.handleValueSaving}
                    state={pollType.value}
                  />
                </Step>
                <Step id="final">
                  <ResultPage
                    success={updates.success}
                    error={updates.error}
                    onRestart={() => {
                      this.reset();
                      push('poll');
                    }}
                  />
                </Step>
              </Steps>
              <Navigation onSubmit={this.handleSubmission} />
            </StepPage>
          )}
        </Wizard>
      </Box>
    );
  }
}

const mapStateToProps = state => ({
  tags: getTags(state),
  updates: getProposalUpdates(state, '0000'),
  users: getVisibleUsers(state, 'all'),
  user: getSessionUser(state),
});

const mapDispatch = {
  createProposal,
  findUser,
};

export default connect(
  mapStateToProps,
  mapDispatch,
)(withStyles(s)(ProposalInput));
