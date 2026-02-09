class HomeController < ApplicationController
  def show
    # Redirect new users to setup flow
    if Current.user.students.empty?
      redirect_to setup_path
    else
      # Existing users go straight to the weekly view
      redirect_to week_path
    end
  end
end
