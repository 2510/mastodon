# frozen_string_literal: true

module AccountHeader
  extend ActiveSupport::Concern

  IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].freeze
  LIMIT = 4.megabytes
  MAX_PIXELS = 750_000 # 1500x500px

  class_methods do
    def header_styles(file)
      styles = {
        original: {
          pixels: MAX_PIXELS,
          file_geometry_parser: FastGeometryParser,
          convert_options: '+profile exif',
        }.freeze,

        tiny: {
          format: 'webp',
          file_geometry_parser: FastGeometryParser,
          convert_options: '-coalesce +profile exif -colorspace RGB -filter Lanczos -define filter:blur=.9891028367558475 -distort Resize 40000@ -colorspace sRGB -define webp:use-sharp-yuv=1',
        }.freeze,
      }

      styles[:static] = { pixels: MAX_PIXELS, format: 'webp', animated: false, convert_options: '-coalesce +profile exif', file_geometry_parser: FastGeometryParser, processors: [:thumbnail] } if file.content_type == 'image/gif'
      styles
    end

    private :header_styles
  end

  included do
    # Header upload
    has_attached_file :header, styles: ->(f) { header_styles(f) }, processors: [:lazy_thumbnail, :thumbhash_transcoder]
    validates_attachment_content_type :header, content_type: IMAGE_MIME_TYPES
    validates_attachment_size :header, less_than: LIMIT
    remotable_attachment :header, LIMIT, suppress_errors: false
  end

  def header_original_url
    header.url(:original)
  end

  def header_tiny_url
    header.url(:tiny)
  end

  def header_static_url
    header_content_type == 'image/gif' ? header.url(:static) : header_original_url
  end
end
