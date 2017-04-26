/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { denormalize } from 'normalizr';
import Proposal from '../../components/Proposal';
import { proposal as proposalSchema } from '../../store/schema';

class ProposalContainer extends React.Component {
  static propTypes = {
    proposal: PropTypes.object.isRequired,
    proposalId: PropTypes.number.isRequired,
  };
  isReady() {
    // Probably superflue bc we are awaiting the LOAD_PROPOSAL_xxx flow
    return this.props.proposal != null;
  }
  render() {
    if (this.isReady()) {
      return <Proposal proposal={this.props.proposal} />;
    }
    return <div>STILL LOADING ...</div>;
  }
}
ProposalContainer.propTypes = {};
// TODO implement memoiziation with reselect
const mapStateToProps = (state, ownProps) => {
  const data = state.entities.proposals[ownProps.proposalId];
  const proposal = denormalize(data, proposalSchema, state.entities);

  return {
    proposal,
  };
};

export default connect(mapStateToProps)(ProposalContainer);
