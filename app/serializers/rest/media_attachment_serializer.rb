# frozen_string_literal: true

class REST::MediaAttachmentSerializer < ActiveModel::Serializer
  include RoutingHelper

  attributes :id, :type, :url, :preview_url,
             :remote_url, :preview_remote_url, :text_url, :meta,
             :description, :blurhash, :thumbhash

  def id
    object.id.to_s
  end

  def url
    if object.not_processed?
      nil
    elsif object.needs_redownload?
      media_proxy_url(object.id, :original)
    else
      full_asset_url(object.file.url(:original))
    end
  end

  def remote_url
    object.remote_url.presence
  end

  def preview_url
    tiny = respond_to?(:current_user) && current_user&.setting_use_low_resolution_thumbnails

    if object.needs_redownload?
      media_proxy_url(object.id, tiny ? :tiny : :small)
    elsif tiny && object.file.styles.key?(:tiny)
      full_asset_url(object.file.url(:tiny), ext: object.file_file_name)
    elsif object.file.styles.key?(:small)
      full_asset_url(object.file.url(:small), ext: object.file_file_name)
    elsif object.thumbnail.present?
      full_asset_url(object.thumbnail.url(:original))
    end
  end

  def preview_remote_url
    object.thumbnail_remote_url.presence
  end

  def text_url
    object.local? ? medium_url(object) : nil
  end

  def meta
    object.file.meta
  end
end
