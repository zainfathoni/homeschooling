class SessionsController < ApplicationController
  allow_unauthenticated_access only: %i[new create]

  def new
  end

  def create
    if (user = User.authenticate_by(email: params[:email], password: params[:password]))
      login user
      redirect_to root_path, notice: "Signed in successfully."
    else
      flash.now[:alert] = "Invalid email or password."
      render :new, status: :unprocessable_entity
    end
  end

  def destroy
    logout
    redirect_to login_path, notice: "Signed out successfully."
  end
end
