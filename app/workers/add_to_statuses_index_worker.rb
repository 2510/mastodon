# frozen_string_literal: true

class AddToStatusesIndexWorker
  include Sidekiq::Worker
  
  sidekiq_options queue: 'pull'

  def perform(account_id)
    account = Account.find(account_id)
  
    return unless account.indexable?

    account.add_to_statuses_index!
  rescue ActiveRecord::RecordNotFound
    true
  end
end
