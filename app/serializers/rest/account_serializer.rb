# frozen_string_literal: true

class REST::AccountSerializer < ActiveModel::Serializer
  include RoutingHelper

  attributes :id, :username, :acct, :display_name, :locked, :bot, :cat, :discoverable, :group, :created_at,
             :note, :url, :avatar, :avatar_static, :header, :header_static, :searchability,
             :followers_count, :following_count, :subscribing_count, :statuses_count, :last_status_at,
             :avatar_thumbhash, :header_thumbhash

  has_one :moved_to_account, key: :moved, serializer: REST::AccountSerializer, if: :moved_and_not_nested?

  has_many :emojis, serializer: REST::CustomEmojiSerializer

  attribute :suspended, if: :suspended?

  class FieldSerializer < ActiveModel::Serializer
    attributes :name, :value, :verified_at

    def value
      Formatter.instance.format_field(object.account, object.value)
    end
  end

  has_many :fields
  has_many :other_settings

  def id
    object.id.to_s
  end

  def acct
    object.pretty_acct
  end

  def note
    object.suspended? ? '' : Formatter.instance.simplified_format(object)
  end

  def url
    ActivityPub::TagManager.instance.url_for(object)
  end

  def avatar
    if respond_to?(:current_user) && current_user&.setting_use_low_resolution_thumbnails
      full_asset_url(object.suspended? ? object.avatar.default_url : object.avatar_tiny_url, ext: object.avatar_file_name)
    else
      full_asset_url(object.suspended? ? object.avatar.default_url : object.avatar_original_url)
    end
  end

  def avatar_static
    if respond_to?(:current_user) && current_user&.setting_use_low_resolution_thumbnails
      full_asset_url(object.suspended? ? object.avatar.default_url : object.avatar_tiny_url, ext: object.avatar_file_name)
    else
      full_asset_url(object.suspended? ? object.avatar.default_url : object.avatar_static_url, ext: object.avatar_file_name)
    end
  end

  def header
    if object.header_file_name.nil?
      full_asset_url(object.header_tiny_url)
    elsif respond_to?(:current_user) && current_user&.setting_use_low_resolution_thumbnails
      full_asset_url(object.suspended? ? object.header.default_url : object.header_tiny_url, ext: object.header_file_name)
    else
      full_asset_url(object.suspended? || object.header.nil? ? object.header.default_url : object.header_original_url)
    end
  end

  def header_static
    if object.header_file_name.nil?
      full_asset_url(object.header_tiny_url)
    elsif respond_to?(:current_user) && current_user&.setting_use_low_resolution_thumbnails
      full_asset_url(object.suspended? || object.header.nil? ? object.header.default_url : object.header_tiny_url, ext: object.header_file_name)
    else
      full_asset_url(object.suspended? || object.header.nil? ? object.header.default_url : object.header_static_url, ext: object.header_file_name)
    end
  end

  def created_at
    object.created_at.midnight.as_json
  end

  def last_status_at
    object.last_status_at&.to_date&.iso8601
  end

  def statuses_count
    object.public_statuses_count
  end

  def following_count
    object.public_following_count
  end

  def followers_count
    object.public_followers_count
  end

  def display_name
    object.suspended? ? '' : object.display_name
  end

  def locked
    object.suspended? ? false : object.locked
  end

  def bot
    object.suspended? ? false : object.bot
  end

  def cat
    object.suspended? ? false : object.cat
  end

  def discoverable
    object.suspended? ? false : object.discoverable
  end

  def moved_to_account
    object.suspended? ? nil : object.moved_to_account
  end

  def emojis
    object.suspended? ? [] : object.emojis
  end

  def fields
    object.suspended? ? [] : object.fields
  end

  def other_settings
    object.suspended? ? [] : object.other_settings
  end

  def suspended
    object.suspended?
  end

  delegate :suspended?, to: :object

  def moved_and_not_nested?
    object.moved? && object.moved_to_account.moved_to_account_id.nil?
  end
end
