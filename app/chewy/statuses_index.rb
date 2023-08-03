# frozen_string_literal: true

class StatusesIndex < Chewy::Index
  settings index: { refresh_interval: '15m' }, analysis: {
    filter: {
      english_stop: {
        type: 'stop',
        stopwords: '_english_',
      },

      english_stemmer: {
        type: 'stemmer',
        language: 'english',
      },

      english_possessive_stemmer: {
        type: 'stemmer',
        language: 'possessive_english',
      },

      search: {
        type: 'sudachi_split',
        mode: 'search',
      },
    },

    char_filter: {
      tsconvert: {
        type: 'stconvert',
        keep_both: false,
        delimiter: '#',
        convert_type: 't2s',
      },
    },

    tokenizer: {
      sudachi_tokenizer: {
        type: 'sudachi_tokenizer',
        discard_punctuation: true,
        resources_path: '/etc/elasticsearch/sudachi',
        settings_path: '/etc/elasticsearch/sudachi/sudachi.json',
      },

      nori_user_dict: {
        type: 'nori_tokenizer',
        decompound_mode: 'mixed',
      },
    },

    analyzer: {
      en_content: {
        tokenizer: 'uax_url_email',
        filter: %w(
          english_possessive_stemmer
          lowercase
          asciifolding
          cjk_width
          english_stop
          english_stemmer
        ),
      },

      ja_content: {
        filter: %w(
          lowercase
          cjk_width
          sudachi_part_of_speech
          sudachi_ja_stop
          sudachi_baseform
          search
        ),
        tokenizer: 'sudachi_tokenizer',
        type: 'custom',
      },

      ko_content: {
        tokenizer: 'nori_user_dict',
        filter: %w(
          english_possessive_stemmer
          lowercase
          asciifolding
          cjk_width
          english_stop
          english_stemmer
        ),
      },

      zh_content: {
        tokenizer: 'ik_max_word',
        filter: %w(
          english_possessive_stemmer
          lowercase
          asciifolding
          cjk_width
          english_stop
          english_stemmer
        ),
        char_filter: %w(tsconvert),
      },
    },
  }

  index_scope ::Status.unscoped.kept.without_reblogs.includes(:media_attachments, :preloadable_poll)

  crutch :mentions do |collection|
    data = ::Mention.where(status_id: collection.map(&:id)).where(account: Account.local, silent: false).pluck(:status_id, :account_id)
    data.each.with_object({}) { |(id, name), result| (result[id] ||= []).push(name) }
  end

  crutch :favourites do |collection|
    data = ::Favourite.where(status_id: collection.map(&:id)).where(account: Account.local).pluck(:status_id, :account_id)
    data.each.with_object({}) { |(id, name), result| (result[id] ||= []).push(name) }
  end

  crutch :reblogs do |collection|
    data = ::Status.where(reblog_of_id: collection.map(&:id)).where(account: Account.local).pluck(:reblog_of_id, :account_id)
    data.each.with_object({}) { |(id, name), result| (result[id] ||= []).push(name) }
  end

  crutch :bookmarks do |collection|
    data = ::Bookmark.where(status_id: collection.map(&:id)).where(account: Account.local).pluck(:status_id, :account_id)
    data.each.with_object({}) { |(id, name), result| (result[id] ||= []).push(name) }
  end

  crutch :votes do |collection|
    data = ::PollVote.joins(:poll).where(poll: { status_id: collection.map(&:id) }).where(account: Account.local).pluck(:status_id, :account_id)
    data.each.with_object({}) { |(id, name), result| (result[id] ||= []).push(name) }
  end

  crutch :emoji_reactions do |collection|
    data = ::EmojiReaction.where(status_id: collection.map(&:id)).where(account: Account.local).pluck(:status_id, :account_id)
    data.each.with_object({}) { |(id, name), result| (result[id] ||= []).push(name) }
  end

  crutch :status_references do |collection|
    data = ::StatusReference.joins(:status).where(target_status_id: collection.map(&:id)).where(status: { account: Account.local }).pluck(:target_status_id, :'status.account_id')
    data.each.with_object({}) { |(id, name), result| (result[id] ||= []).push(name) }
  end

  root date_detection: false do
    field :id, type: 'long'
    field :account_id, type: 'long'
    field :domain, type: 'keyword', value: ->(status) { status.account_domain }
    field :created_at, type: 'date'

    field :text, type: 'text', value: ->(status) { status.index_text } do
      field :en_stemmed, type: 'text', analyzer: 'en_content'
      field :ja_stemmed, type: 'text', analyzer: 'ja_content'
      field :ko_stemmed, type: 'text', analyzer: 'ko_content'
      field :zh_stemmed, type: 'text', analyzer: 'zh_content'
    end

    field :reply, type: 'boolean', value: ->(status) { status.reply_without_self? }
    field :quote, type: 'boolean', value: ->(status) { !!status.quote? }
    field :poll, type: 'boolean', value: ->(status) { status.preloadable_poll.present? }
    field :safe, type: 'boolean', value: ->(status) { status.safe? }
    field :generator, type: 'keyword', value: ->(status) { status.generator&.name }

    field :mentioned_account_id, type: 'long'
    field :tag_id, type: 'long'
    field :media_type, type: 'keyword'
    field :reference_type, type: 'keyword'
    field :language, type: 'keyword'
    field :urls, type: 'keyword'

    field :replies_count, type: 'long'
    field :reblogs_count, type: 'long'
    field :favourites_count, type: 'long'
    field :emoji_reactions_count, type: 'long'
    field :status_referred_by_count, type: 'long'

    field :visibility, type: 'keyword'
    field :searchable_by, type: 'long', value: ->(status, crutches) { status.searchable_by(crutches) }
    field :searchability, type: 'keyword', value: ->(status) { status.compute_searchability }
  end
end
