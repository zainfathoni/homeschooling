Rails.application.routes.draw do
  get "login", to: "sessions#new"
  post "login", to: "sessions#create"
  delete "logout", to: "sessions#destroy"

  get "signup", to: "registrations#new"
  post "signup", to: "registrations#create"

  resources :students, only: [ :index, :new, :create, :edit, :update, :destroy ] do
    member do
      post :select
    end
    resources :subjects, only: [ :index, :new, :create, :edit, :update, :destroy ]
    resources :narrations
  end

  get "today", to: "today#index"
  get "report", to: "reports#index"
  post "completions/toggle", to: "completions#toggle", as: :toggle_completion

  get "up" => "rails/health#show", as: :rails_health_check

  root "home#show"
end
