import React from 'react';
import PropTypes from 'prop-types';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import Textarea from 'react-textarea-autosize';
import Button from '../Button';
import Box from '../Box';
import CheckBox from '../CheckBox';
import PollOptionPreview from './PollOptionPreview';
import FormValidation from '../FormValidation';

import s from './OptionInput.css';

const validateOptions = options => {
  const posNumbers = [];
  options.map((option, i) => {
    if (option.pos) {
      if (posNumbers.includes(option.id)) {
        throw new Error('Id must be unique');
      }
      return option;
    }
    let newPos = i;
    while (posNumbers.includes(newPos)) {
      posNumbers.push(newPos);
      newPos += 1;
    }
    return { ...option, pos: newPos };
  });
};

class OptionInput extends React.Component {
  static propTypes = {
    onAddOption: PropTypes.func.isRequired,
    data: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
    onExit: PropTypes.func.isRequired,
    stepId: PropTypes.string.isRequired,
    callback: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {};
    this.handleAddOption = this.handleAddOption.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleNext = this.handleNext.bind(this);
    this.handleSaving = this.handleSaving.bind(this);
    this.onBeforeNextStep = this.onBeforeNextStep.bind(this);
    this.handleDeletion = this.handleDeletion.bind(this);
    this.form = React.createRef();
  }

  componentDidMount() {
    const { callback, stepId } = this.props;
    if (callback) {
      callback(stepId, this.onBeforeNextStep);
    }
  }

  onBeforeNextStep() {
    if (this.form.current) {
      const validationResult = this.form.current.enforceValidation(['options']);
      if (validationResult.isValid) {
        this.handleNext(validationResult.values);
        return true;
      }
    }
    return false;
  }

  handleNext(values) {
    const { onExit, data } = this.props;
    if (onExit) {
      let newOptions;
      if (values.options) {
        newOptions = validateOptions(values.options);
      }
      newOptions = newOptions || data;
      onExit([{ name: 'options', value: newOptions }]);
    }
  }

  handleAddOption() {
    const { onAddOption } = this.props;
    const { description } = this.state;
    if (description) {
      onAddOption({ description });
      this.setState({ description: '' });
    }
  }

  handleInputChange(e) {
    this.setState({ description: e.target.value });
  }

  handleSaving(newData) {
    const { onExit, data } = this.props;
    // take all, change saved option
    const newOptions = data.map(
      option => (option.pos === newData.pos ? newData : option),
    );
    if (onExit) {
      onExit([{ name: 'options', value: newOptions }]);
    }
  }

  handleDeletion(pos) {
    const { onExit, data } = this.props;
    // take all, change saved option
    const newOptions = data.filter(option => option.pos !== pos);

    if (onExit) {
      onExit([{ name: 'options', value: newOptions }]);
    }
  }

  render() {
    const { data } = this.props;
    const { description } = this.state;
    return (
      <FormValidation
        ref={this.form}
        submit={this.handleNext}
        validations={{ options: { args: { min: 2, required: false } } }}
        data={{ options: data.length ? data : undefined }}
      >
        {({ errorMessages }) => (
          <Box column>
            <Box column>
              {data &&
                data.map(o => (
                  <PollOptionPreview
                    key={o.pos}
                    pos={o.pos}
                    description={o.description}
                    onSave={this.handleSaving}
                    onDelete={this.handleDeletion}
                  />
                ))}
            </Box>
            <CheckBox disabled checked label="multiple choice" />
            <div className={s.inputField}>
              <Textarea
                className={s.input}
                placeholder="Enter some text"
                name="option"
                useCacheForDOMMeasurements
                value={description}
                onChange={this.handleInputChange}
                minRows={2}
              />
            </div>
            {errorMessages.optionsError}
            <Button onClick={this.handleAddOption} label="Add" />
          </Box>
        )}
      </FormValidation>
    );
  }
}

export default withStyles(s)(OptionInput);
