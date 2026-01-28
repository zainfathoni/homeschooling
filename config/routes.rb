Rails.application.routes.draw do
  get "login", to: "sessions#new"
  post "login", to: "sessions#create"
  delete "logout", to: "sessions#destroy"

  get "signup", to: "registrations#new"
  post "signup", to: "registrations#create"

  get "up" => "rails/health#show", as: :rails_health_check

  root "home#show"
end
