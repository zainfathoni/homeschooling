class ApplicationController < ActionController::Base
  include Authentication
  include StudentSelection

  allow_browser versions: :modern
  stale_when_importmap_changes
end
