class StudentGroupsController < ApplicationController
  before_action :set_student_group, only: [ :show, :edit, :update, :destroy ]

  def index
    @student_groups = Current.user.student_groups.includes(:teachable, students: :teachable)
  end

  def show
  end

  def new
    @student_group = StudentGroup.new(group_type: :family)
    @student_group.build_teachable
    load_students
  end

  def create
    @student_group = StudentGroup.new(student_group_params)
    @student_group.build_teachable(user: Current.user) unless @student_group.teachable
    @student_group.teachable.user = Current.user if @student_group.teachable

    if @student_group.save
      assign_memberships(@student_group)
      redirect_to student_groups_path, notice: "Group was successfully created."
    else
      load_students
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    load_students
  end

  def update
    if @student_group.update(student_group_params)
      assign_memberships(@student_group)
      redirect_to student_groups_path, notice: "Group was successfully updated."
    else
      load_students
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @student_group.destroy
    redirect_to student_groups_path, notice: "Group was successfully deleted."
  end

  private

  def set_student_group
    @student_group = Current.user.student_groups.includes(:teachable, students: :teachable).find(params[:id])
  rescue ActiveRecord::RecordNotFound
    redirect_to student_groups_path, alert: "Group not found"
  end

  def student_group_params
    params.require(:student_group).permit(:group_type, teachable_attributes: [ :id, :name ])
  end

  def assign_memberships(student_group)
    student_ids = Array(params.dig(:student_group, :student_ids)).reject(&:blank?)
    valid_ids = Current.user.students.where(id: student_ids).pluck(:id)
    student_group.group_memberships.destroy_all
    valid_ids.each do |student_id|
      student_group.group_memberships.create(student_id: student_id)
    end
  end

  def load_students
    @students = Current.user.students.includes(:teachable).order("teachables.name")
  end
end
