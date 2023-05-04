# frozen_string_literal: true

module AccountAvatar
  extend ActiveSupport::Concern

  IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].freeze
  LIMIT = 2.megabytes

  BLURHASH_OPTIONS = {
    x_comp: 4,
    y_comp: 4,
  }.freeze

  class_methods do
    def avatar_styles(file)
      styles = {
        original: {
          geometry: '400x400#',
          file_geometry_parser: FastGeometryParser,
          convert_options: '+profile exif',
        }.freeze,

        tiny: {
          format: 'webp',
          file_geometry_parser: FastGeometryParser,
          convert_options: '-coalesce +profile exif -colorspace RGB -filter Lanczos -define filter:blur=.9891028367558475 -distort Resize \'120x120^\' -gravity center -crop 1:1 -colorspace sRGB -define webp:use-sharp-yuv=1 -define webp:emulate-jpeg-size=true -quality 80',
          blurhash: BLURHASH_OPTIONS,
        }.freeze,
      }

      styles[:static] = { geometry: '400x400#', format: 'webp', animated: false, convert_options: '-coalesce +profile exif', file_geometry_parser: FastGeometryParser, processors: [:thumbnail] } if file.content_type == 'image/gif'
      styles
    end

    private :avatar_styles
  end

  included do
    # Avatar upload
    has_attached_file :avatar, styles: ->(f) { avatar_styles(f) }, processors: [:lazy_thumbnail, :blurhash_transcoder, :thumbhash_transcoder]
    validates_attachment_content_type :avatar, content_type: IMAGE_MIME_TYPES
    validates_attachment_size :avatar, less_than: LIMIT
    remotable_attachment :avatar, LIMIT, suppress_errors: false
  end

  def avatar_original_url
    avatar.url(:original)
  end

  def avatar_tiny_url
    avatar.url(:tiny)
  end

  def avatar_static_url
    avatar_content_type == 'image/gif' ? avatar.url(:static) : avatar_original_url
  end
end
