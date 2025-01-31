import React from 'react';
import { connect } from 'react-redux';
import ImmutablePureComponent from 'react-immutable-pure-component';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import LoadingIndicator from '../../components/loading_indicator';
import { fetchEmojiReactions, expandEmojiReactions } from '../../actions/interactions';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import AccountContainer from '../../containers/account_container';
import Column from '../ui/components/column';
import ScrollableList from '../../components/scrollable_list';
import Icon from 'mastodon/components/icon';
import ColumnHeader from '../../components/column_header';
import Emoji from '../../components/emoji';
import ReactedHeaderContaier from '../reactioned/containers/header_container';
import { debounce } from 'lodash';
import { defaultColumnWidth } from 'mastodon/initial_state';
import { changeSetting } from '../../actions/settings';
import { changeColumnParams } from '../../actions/columns';

const messages = defineMessages({
  refresh: { id: 'refresh', defaultMessage: 'Refresh' },
});

const mapStateToProps = (state, { columnId, params }) => {
  const uuid = columnId;
  const columns = state.getIn(['settings', 'columns']);
  const index = columns.findIndex(c => c.get('uuid') === uuid);
  const columnWidth = (columnId && index >= 0) ? columns.get(index).getIn(['params', 'columnWidth']) : state.getIn(['settings', 'emoji_reactions', 'columnWidth']);

  return {
    emojiReactions: state.getIn(['user_lists', 'emoji_reactioned_by', params.statusId, 'items']),
    isLoading: state.getIn(['user_lists', 'emoji_reactioned_by', params.statusId, 'isLoading'], true),
    hasMore: !!state.getIn(['user_lists', 'emoji_reactioned_by', params.statusId, 'next']),
    columnWidth: columnWidth ?? defaultColumnWidth,
  };
};

class Reaction extends ImmutablePureComponent {

  static propTypes = {
    emojiReaction: ImmutablePropTypes.map,
  };

  state = {
    hovered: false,
  };

  handleMouseEnter = () => this.setState({ hovered: true })

  handleMouseLeave = () => this.setState({ hovered: false })

  render () {
    const { emojiReaction } = this.props;

    return (
      <div className='account__emoji_reaction' onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave}>
        <Emoji className='reaction' hovered={this.state.hovered} emoji={emojiReaction.get('name')} url={emojiReaction.get('url')} static_url={emojiReaction.get('static_url')} domain={emojiReaction.get('domain')} />
      </div>
    );
  };
}

class EmojiReactions extends React.PureComponent {

  static contextTypes = {
    router: PropTypes.object,
  };

  static propTypes = {
    params: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    emojiReactions: ImmutablePropTypes.list,
    multiColumn: PropTypes.bool,
    columnWidth: PropTypes.string,
    intl: PropTypes.object.isRequired,
    hasMore: PropTypes.bool,
    isLoading: PropTypes.bool,
  };

  componentDidMount () {
    const { emojiReactions, params: { statusId }, dispatch } = this.props;

    if (!emojiReactions) {
      dispatch(fetchEmojiReactions(statusId));
    }

    this._updateEmojiLinks();
  }

  componentDidUpdate (prevProps) {
    const { emojiReactions, params: { statusId }, dispatch } = this.props;

    if (!emojiReactions || prevProps.params.statusId !== statusId) {
      dispatch(fetchEmojiReactions(statusId));
    }

    this._updateEmojiLinks();
  }

  componentWillUnmount () {
    this._removeEmojiLinks();
  }

  _updateEmojiLinks () {
    const node = this.node;

    if (!node) {
      return;
    }

    const emojis = node.querySelectorAll('.custom-emoji');

    for (var i = 0; i < emojis.length; i++) {
      let emoji = emojis[i];
      emoji.addEventListener('click', this.handleEmojiClick, false);
      emoji.style.cursor = 'pointer';
    }
  }

  _removeEmojiLinks () {
    const node = this.node;

    if (!node) {
      return;
    }

    const emojis = node.querySelectorAll('.custom-emoji');

    for (var i = 0; i < emojis.length; i++) {
      let emoji = emojis[i];
      emoji.removeEventListener('click', this.handleEmojiClick, false);
      emoji.style.cursor = 'default';
    }
  }

  handleEmojiClick = e => {
    const shortcode = e.target.dataset.shortcode;
    const domain = e.target.dataset.domain;

    if (this.context.router) {
      e.preventDefault();
      e.stopPropagation();
      this.context.router.history.push(`/emoji_detail/${shortcode}${domain ? `@${domain}` : ''}`);
    }
  }

  handleRefresh = () => {
    const { params: { statusId }, dispatch } = this.props;

    dispatch(fetchEmojiReactions(statusId));
  }

  handleLoadMore = debounce(() => {
    const { params: { statusId }, dispatch } = this.props;

    dispatch(expandEmojiReactions(statusId));
  }, 300, { leading: true })

  handleWidthChange = (value) => {
    const { columnId, dispatch } = this.props;

    if (columnId) {
      dispatch(changeColumnParams(columnId, 'columnWidth', value));
    } else {
      dispatch(changeSetting(['emoji_reactions', 'columnWidth'], value));
    }
  }

  setRef = (c) => {
    this.node = c;
  }

  render () {
    const { intl, emojiReactions, multiColumn, hasMore, isLoading, columnWidth } = this.props;

    if (!emojiReactions) {
      return (
        <Column>
          <LoadingIndicator />
        </Column>
      );
    }

    const emptyMessage = <FormattedMessage id='empty_column.emoji_reactions' defaultMessage='No one has reactioned this post yet. When someone does, they will show up here.' />;

    return (
      <Column bindToDocument={!multiColumn} columnWidth={columnWidth}>
        <ColumnHeader
          showBackButton
          multiColumn={multiColumn}
          columnWidth={columnWidth}
          onWidthChange={this.handleWidthChange}
          extraButton={(
            <button className='column-header__button' title={intl.formatMessage(messages.refresh)} aria-label={intl.formatMessage(messages.refresh)} onClick={this.handleRefresh}><Icon id='refresh' /></button>
          )}
        />

        <ReactedHeaderContaier statusId={this.props.params.statusId} />

        <div ref={this.setRef}>
          <ScrollableList
            scrollKey='emoji_reactions'
            hasMore={hasMore}
            isLoading={isLoading}
            onLoadMore={this.handleLoadMore}
            emptyMessage={emptyMessage}
            bindToDocument={!multiColumn}
          >
            {emojiReactions.map(emojiReaction =>
              <AccountContainer key={emojiReaction.get('account')+emojiReaction.get('name')} id={emojiReaction.get('account')} withNote={false} append={<Reaction emojiReaction={emojiReaction} />} />,
            )}
          </ScrollableList>
        </div>
      </Column>
    );
  }

}

export default injectIntl(connect(mapStateToProps)(EmojiReactions));
