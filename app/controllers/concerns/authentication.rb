module Authentication
  extend ActiveSupport::Concern

  included do
    before_action :require_authentication
    helper_method :authenticated?
  end

  class_methods do
    def allow_unauthenticated_access(**options)
      skip_before_action :require_authentication, **options
    end
  end

  private

  def authenticated?
    Current.user.present?
  end

  def require_authentication
    resume_session || request_authentication
  end

  def resume_session
    Current.user = User.find_by(id: session[:user_id]) if session[:user_id]
  end

  def request_authentication
    redirect_to login_path, alert: "Please sign in to continue."
  end

  def login(user)
    Current.user = user
    reset_session
    session[:user_id] = user.id
  end

  def logout
    reset_session
  end
end
