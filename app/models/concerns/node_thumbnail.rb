# frozen_string_literal: true

module NodeThumbnail
  extend ActiveSupport::Concern

  IMAGE_MIME_TYPES = %w(image/jpeg image/png image/gif image/webp).freeze
  LIMIT = 4.megabytes
  MAX_PIXELS = 750_000 # 1500x500px

  BLURHASH_OPTIONS = {
    x_comp: 4,
    y_comp: 4,
  }.freeze

  class_methods do
    def thumbnail_styles(file)
      styles = {
        original: {
          pixels: MAX_PIXELS,
          format: 'webp',
          file_geometry_parser: FastGeometryParser,
        }.freeze,

        tiny: {
          format: 'webp',
          file_geometry_parser: FastGeometryParser,
          convert_options: '-coalesce +profile exif -colorspace RGB -filter Lanczos -define filter:blur=.9891028367558475 -distort Resize 40000@ -colorspace sRGB -define webp:use-sharp-yuv=1',
          blurhash: BLURHASH_OPTIONS,
        }.freeze,
      }
      styles[:static] = { format: 'webp', animated: false, convert_options: '-coalesce', file_geometry_parser: FastGeometryParser, processors: [:thumbnail] } if file.content_type == 'image/gif'
      styles
    end

    private :thumbnail_styles
  end

  included do
    # Thumbnail upload
    has_attached_file :thumbnail, styles: ->(f) { thumbnail_styles(f) }, convert_options: { all: '+profile exif' }, processors: [:lazy_thumbnail, :blurhash_transcoder, :thumbhash_transcoder]
    validates_attachment_content_type :thumbnail, content_type: IMAGE_MIME_TYPES
    validates_attachment_size :thumbnail, less_than: LIMIT
    remotable_attachment :thumbnail, LIMIT, suppress_errors: false
  end

  def thumbnail_original_url
    thumbnail.url(:original)
  end

  def thumbnail_static_url
    thumbnail_content_type == 'image/gif' ? thumbnail.url(:static) : thumbnail_original_url
  end
end
