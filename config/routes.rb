Rails.application.routes.draw do
  get "login", to: "sessions#new"
  post "login", to: "sessions#create"
  delete "logout", to: "sessions#destroy"

  get "signup", to: "registrations#new"
  post "signup", to: "registrations#create"

  resources :students, only: [ :index, :show, :new, :create, :edit, :update, :destroy ] do
    member do
      post :select
    end
    resources :subjects, only: [ :index, :new, :create, :edit, :update, :destroy ]
    resources :narrations
    resources :quick_notes
  end

  get "today", to: "daily#show"
  get "daily/:date", to: "daily#show", as: :daily
  get "week", to: "today#index", as: :week
  get "notes", to: "notes#index", as: :notes
  get "settings", to: "settings#index", as: :settings
  get "report", to: "reports#index"
  post "completions/toggle", to: "completions#toggle", as: :toggle_completion

  get "up" => "rails/health#show", as: :rails_health_check

  root "home#show"
end
