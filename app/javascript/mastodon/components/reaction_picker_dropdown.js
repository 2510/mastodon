import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';
import { EmojiPicker as EmojiPickerAsync } from '../features/ui/util/async-components';
import Overlay from 'react-overlays/lib/Overlay';
import classNames from 'classnames';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { supportsPassiveEvents } from 'detect-passive-events';
import { buildCustomEmojis, categoriesFromEmojis } from '../features/emoji/emoji';
import { assetHost } from 'mastodon/utils/config';
import IconButton from './icon_button';

const messages = defineMessages({
  emoji: { id: 'emoji_button.label', defaultMessage: 'Insert emoji' },
  emoji_search: { id: 'emoji_button.search', defaultMessage: 'Search...' },
  emoji_not_found: { id: 'emoji_button.not_found', defaultMessage: 'No emojos!! (╯°□°）╯︵ ┻━┻' },
  custom: { id: 'emoji_button.custom', defaultMessage: 'Custom' },
  recent: { id: 'emoji_button.recent', defaultMessage: 'Frequently used' },
  search_results: { id: 'emoji_button.search_results', defaultMessage: 'Search results' },
  people: { id: 'emoji_button.people', defaultMessage: 'People' },
  nature: { id: 'emoji_button.nature', defaultMessage: 'Nature' },
  food: { id: 'emoji_button.food', defaultMessage: 'Food & Drink' },
  activity: { id: 'emoji_button.activity', defaultMessage: 'Activity' },
  travel: { id: 'emoji_button.travel', defaultMessage: 'Travel & Places' },
  objects: { id: 'emoji_button.objects', defaultMessage: 'Objects' },
  symbols: { id: 'emoji_button.symbols', defaultMessage: 'Symbols' },
  flags: { id: 'emoji_button.flags', defaultMessage: 'Flags' },
});

let EmojiPicker, Emoji; // load asynchronously

const backgroundImageFn = () => `${assetHost}/emoji/sheet_13.png`;
const listenerOptions = supportsPassiveEvents ? { passive: true } : false;

class ModifierPickerMenu extends React.PureComponent {

  static propTypes = {
    active: PropTypes.bool,
    onSelect: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
  };

  handleClick = e => {
    this.props.onSelect(e.currentTarget.getAttribute('data-index') * 1);
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.active) {
      this.attachListeners();
    } else {
      this.removeListeners();
    }
  }

  componentWillUnmount () {
    this.removeListeners();
  }

  handleDocumentClick = e => {
    if (this.node && !this.node.contains(e.target)) {
      this.props.onClose();
    }
  }

  attachListeners () {
    document.addEventListener('click', this.handleDocumentClick, false);
    document.addEventListener('touchend', this.handleDocumentClick, listenerOptions);
  }

  removeListeners () {
    document.removeEventListener('click', this.handleDocumentClick, false);
    document.removeEventListener('touchend', this.handleDocumentClick, listenerOptions);
  }

  setRef = c => {
    this.node = c;
  }

  render () {
    const { active } = this.props;

    return (
      <div className='emoji-picker-dropdown__modifiers__menu' style={{ display: active ? 'block' : 'none' }} ref={this.setRef}>
        <button onClick={this.handleClick} data-index={1}><Emoji emoji='fist' set='twitter' size={22} sheetSize={32} skin={1} backgroundImageFn={backgroundImageFn} /></button>
        <button onClick={this.handleClick} data-index={2}><Emoji emoji='fist' set='twitter' size={22} sheetSize={32} skin={2} backgroundImageFn={backgroundImageFn} /></button>
        <button onClick={this.handleClick} data-index={3}><Emoji emoji='fist' set='twitter' size={22} sheetSize={32} skin={3} backgroundImageFn={backgroundImageFn} /></button>
        <button onClick={this.handleClick} data-index={4}><Emoji emoji='fist' set='twitter' size={22} sheetSize={32} skin={4} backgroundImageFn={backgroundImageFn} /></button>
        <button onClick={this.handleClick} data-index={5}><Emoji emoji='fist' set='twitter' size={22} sheetSize={32} skin={5} backgroundImageFn={backgroundImageFn} /></button>
        <button onClick={this.handleClick} data-index={6}><Emoji emoji='fist' set='twitter' size={22} sheetSize={32} skin={6} backgroundImageFn={backgroundImageFn} /></button>
      </div>
    );
  }

}

class ModifierPicker extends React.PureComponent {

  static propTypes = {
    active: PropTypes.bool,
    modifier: PropTypes.number,
    onChange: PropTypes.func,
    onClose: PropTypes.func,
    onOpen: PropTypes.func,
  };

  handleClick = () => {
    if (this.props.active) {
      this.props.onClose();
    } else {
      this.props.onOpen();
    }
  }

  handleSelect = modifier => {
    this.props.onChange(modifier);
    this.props.onClose();
  }

  render () {
    const { active, modifier } = this.props;

    return (
      <div className='emoji-picker-dropdown__modifiers'>
        <Emoji emoji='fist' set='twitter' size={22} sheetSize={32} skin={modifier} onClick={this.handleClick} backgroundImageFn={backgroundImageFn} />
        <ModifierPickerMenu active={active} onSelect={this.handleSelect} onClose={this.props.onClose} />
      </div>
    );
  }

}

@injectIntl
class EmojiPickerMenu extends React.PureComponent {

  static propTypes = {
    custom_emojis: ImmutablePropTypes.list,
    frequentlyUsedEmojis: PropTypes.arrayOf(PropTypes.string),
    loading: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    onPick: PropTypes.func.isRequired,
    style: PropTypes.object,
    placement: PropTypes.string,
    arrowOffsetLeft: PropTypes.string,
    arrowOffsetTop: PropTypes.string,
    intl: PropTypes.object.isRequired,
    skinTone: PropTypes.number.isRequired,
    onSkinTone: PropTypes.func.isRequired,
  };

  static defaultProps = {
    style: {},
    loading: true,
    frequentlyUsedEmojis: [],
  };

  state = {
    modifierOpen: false,
    placement: null,
  };

  handleDocumentClick = e => {
    if (this.node && !this.node.contains(e.target)) {
      this.props.onClose();
    }
  }

  componentDidMount () {
    document.addEventListener('click', this.handleDocumentClick, false);
    document.addEventListener('touchend', this.handleDocumentClick, listenerOptions);
  }

  componentWillUnmount () {
    document.removeEventListener('click', this.handleDocumentClick, false);
    document.removeEventListener('touchend', this.handleDocumentClick, listenerOptions);
  }

  setRef = c => {
    this.node = c;
  }

  getI18n = () => {
    const { intl } = this.props;

    return {
      search: intl.formatMessage(messages.emoji_search),
      notfound: intl.formatMessage(messages.emoji_not_found),
      categories: {
        search: intl.formatMessage(messages.search_results),
        recent: intl.formatMessage(messages.recent),
        people: intl.formatMessage(messages.people),
        nature: intl.formatMessage(messages.nature),
        foods: intl.formatMessage(messages.food),
        activity: intl.formatMessage(messages.activity),
        places: intl.formatMessage(messages.travel),
        objects: intl.formatMessage(messages.objects),
        symbols: intl.formatMessage(messages.symbols),
        flags: intl.formatMessage(messages.flags),
        custom: intl.formatMessage(messages.custom),
      },
    };
  }

  handleClick = (emoji, event) => {
    if (!emoji.native) {
      emoji.native = emoji.colons;
    }
    if (!(event.ctrlKey || event.metaKey)) {
      this.props.onClose();
    }
    this.props.onPick(emoji);
  }

  handleModifierOpen = () => {
    this.setState({ modifierOpen: true });
  }

  handleModifierClose = () => {
    this.setState({ modifierOpen: false });
  }

  handleModifierChange = modifier => {
    this.props.onSkinTone(modifier);
  }

  render () {
    const { loading, style, intl, custom_emojis, skinTone, frequentlyUsedEmojis } = this.props;

    if (loading) {
      return <div style={{ width: 299 }} />;
    }

    const title = intl.formatMessage(messages.emoji);

    const { modifierOpen } = this.state;

    const categoriesSort = [
      'recent',
      'people',
      'nature',
      'foods',
      'activity',
      'places',
      'objects',
      'symbols',
      'flags',
    ];

    categoriesSort.splice(1, 0, ...Array.from(categoriesFromEmojis(custom_emojis)).sort());

    return (
      <div className={classNames('emoji-picker-dropdown__menu', { selecting: modifierOpen })} style={style} ref={this.setRef}>
        <EmojiPicker
          perLine={6}
          emojiSize={32}
          sheetSize={32}
          custom={buildCustomEmojis(custom_emojis)}
          color=''
          emoji=''
          set='twitter'
          title={title}
          i18n={this.getI18n()}
          onClick={this.handleClick}
          include={categoriesSort}
          skin={skinTone}
          showPreview={false}
          backgroundImageFn={backgroundImageFn}
          autoFocus={false}
          emojiTooltip
        />

        <ModifierPicker
          active={modifierOpen}
          modifier={skinTone}
          onOpen={this.handleModifierOpen}
          onClose={this.handleModifierClose}
          onChange={this.handleModifierChange}
        />
      </div>
    );
  }

}

export default @injectIntl
class ReactionPickerDropdown extends React.PureComponent {

  static propTypes = {
    custom_emojis: ImmutablePropTypes.list,
    frequentlyUsedEmojis: PropTypes.arrayOf(PropTypes.string),
    intl: PropTypes.object.isRequired,
    onPickEmoji: PropTypes.func.isRequired,
    onRemoveEmoji: PropTypes.func.isRequired,
    onSkinTone: PropTypes.func.isRequired,
    skinTone: PropTypes.number.isRequired,
    button: PropTypes.node,
    dropdownPlacement: PropTypes.string,
    iconButtonClass: PropTypes.string,
    disabled: PropTypes.bool,
    active: PropTypes.bool,
    pressed: PropTypes.bool,
  };

  static defaultProps = {
    iconButtonClass: 'status__action-bar-button',
    disabled: false,
    active: false,
    pressed: false,
  };

  state = {
    active: false,
    loading: false,
  };

  setRef = (c) => {
    this.dropdown = c;
  }

  onShowDropdown = ({ target }) => {
    if (!this.props.disabled) {
      this.setState({ active: true });

      if (!EmojiPicker) {
        this.setState({ loading: true });

        EmojiPickerAsync().then(EmojiMart => {
          EmojiPicker = EmojiMart.Picker;
          Emoji       = EmojiMart.Emoji;

          this.setState({ loading: false });
        }).catch(() => {
          this.setState({ loading: false, active: false });
        });
      }

      const { top } = target.getBoundingClientRect();
    }
  }

  onHideDropdown = () => {
    if (!this.props.disabled) {
      this.setState({ active: false });
    }
  }

  onToggle = (e) => {
    if (!this.state.loading && (!e.key || e.key === 'Enter') && !this.props.disabled) {
      if (this.props.active) {
        this.props.onRemoveEmoji();
      } else if (this.state.active) {
        this.onHideDropdown();
      } else {
        this.onShowDropdown(e);
      }
    }
  }

  handleKeyDown = e => {
    if (e.key === 'Escape' && !this.props.disabled) {
      this.onHideDropdown();
    }
  }

  setTargetRef = c => {
    this.target = c;
  }

  findTarget = () => {
    return this.target;
  }

  render () {
    const { intl, onPickEmoji, onSkinTone, skinTone, frequentlyUsedEmojis, iconButtonClass, dropdownPlacement, disabled, active, pressed } = this.props;
    const title = intl.formatMessage(messages.emoji);
    const { active: show, loading } = this.state;

    return (
      <div className='emoji-picker-dropdown' onKeyDown={this.handleKeyDown}>
        <IconButton disabled={disabled} active={active} pressed={pressed} className={iconButtonClass} ref={this.setTargetRef} title={title} icon='smile-o' onClick={this.onToggle} />
        <Overlay show={show} placement={dropdownPlacement} target={this.findTarget}>
          <EmojiPickerMenu
            custom_emojis={this.props.custom_emojis}
            loading={loading}
            onClose={this.onHideDropdown}
            onPick={onPickEmoji}
            onSkinTone={onSkinTone}
            skinTone={skinTone}
            frequentlyUsedEmojis={frequentlyUsedEmojis}
          />
        </Overlay>
      </div>
    );
  }

}