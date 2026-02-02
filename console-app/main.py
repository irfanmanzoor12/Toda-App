#!/usr/bin/env python3
"""
Todo Console App - Phase I
Hackathon II: In-Memory Python Console Application

Features:
- Add Task
- Delete Task
- Update Task
- View Tasks
- Mark Complete/Incomplete

Spec-Driven Development with Claude Code and Spec-Kit Plus
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
import sys


@dataclass
class Task:
    """Task model for in-memory storage."""
    id: int
    title: str
    description: Optional[str] = None
    completed: bool = False
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)


class TodoApp:
    """In-memory Todo application."""

    def __init__(self):
        self.tasks: dict[int, Task] = {}
        self.next_id: int = 1

    def add_task(self, title: str, description: Optional[str] = None) -> Task:
        """Add a new task."""
        if not title or not title.strip():
            raise ValueError("Title cannot be empty")

        task = Task(
            id=self.next_id,
            title=title.strip(),
            description=description.strip() if description else None
        )
        self.tasks[task.id] = task
        self.next_id += 1
        return task

    def delete_task(self, task_id: int) -> bool:
        """Delete a task by ID."""
        if task_id in self.tasks:
            del self.tasks[task_id]
            return True
        return False

    def update_task(self, task_id: int, title: Optional[str] = None,
                    description: Optional[str] = None) -> Optional[Task]:
        """Update a task's title and/or description."""
        if task_id not in self.tasks:
            return None

        task = self.tasks[task_id]
        if title is not None:
            if not title.strip():
                raise ValueError("Title cannot be empty")
            task.title = title.strip()
        if description is not None:
            task.description = description.strip() if description else None
        task.updated_at = datetime.now()
        return task

    def get_task(self, task_id: int) -> Optional[Task]:
        """Get a task by ID."""
        return self.tasks.get(task_id)

    def list_tasks(self) -> list[Task]:
        """List all tasks."""
        return list(self.tasks.values())

    def mark_complete(self, task_id: int) -> Optional[Task]:
        """Mark a task as complete."""
        if task_id not in self.tasks:
            return None
        task = self.tasks[task_id]
        task.completed = True
        task.updated_at = datetime.now()
        return task

    def mark_incomplete(self, task_id: int) -> Optional[Task]:
        """Mark a task as incomplete."""
        if task_id not in self.tasks:
            return None
        task = self.tasks[task_id]
        task.completed = False
        task.updated_at = datetime.now()
        return task


def print_task(task: Task) -> None:
    """Print a task in a formatted way."""
    status = "✅" if task.completed else "⬜"
    print(f"  {status} [{task.id}] {task.title}")
    if task.description:
        print(f"      Description: {task.description}")


def print_menu() -> None:
    """Print the main menu."""
    print("\n" + "=" * 50)
    print("       TODO CONSOLE APP - Phase I")
    print("=" * 50)
    print("  1. Add Task")
    print("  2. View All Tasks")
    print("  3. Update Task")
    print("  4. Delete Task")
    print("  5. Mark Task Complete")
    print("  6. Mark Task Incomplete")
    print("  7. Exit")
    print("=" * 50)


def main():
    """Main entry point for the console app."""
    app = TodoApp()

    print("\nWelcome to Todo Console App!")
    print("Hackathon II - Phase I: In-Memory Python Console Application")

    while True:
        print_menu()
        choice = input("Enter your choice (1-7): ").strip()

        if choice == "1":
            # Add Task
            print("\n--- Add New Task ---")
            title = input("Enter task title: ").strip()
            if not title:
                print("❌ Error: Title cannot be empty")
                continue
            description = input("Enter description (optional, press Enter to skip): ").strip()
            try:
                task = app.add_task(title, description if description else None)
                print(f"✅ Task added successfully!")
                print_task(task)
            except ValueError as e:
                print(f"❌ Error: {e}")

        elif choice == "2":
            # View All Tasks
            print("\n--- All Tasks ---")
            tasks = app.list_tasks()
            if not tasks:
                print("  No tasks yet. Add one to get started!")
            else:
                pending = [t for t in tasks if not t.completed]
                completed = [t for t in tasks if t.completed]

                if pending:
                    print("\n📋 Pending Tasks:")
                    for task in pending:
                        print_task(task)

                if completed:
                    print("\n✅ Completed Tasks:")
                    for task in completed:
                        print_task(task)

                print(f"\n  Total: {len(tasks)} | Pending: {len(pending)} | Completed: {len(completed)}")

        elif choice == "3":
            # Update Task
            print("\n--- Update Task ---")
            try:
                task_id = int(input("Enter task ID to update: ").strip())
                task = app.get_task(task_id)
                if not task:
                    print(f"❌ Error: Task #{task_id} not found")
                    continue

                print(f"Current task:")
                print_task(task)

                new_title = input("Enter new title (press Enter to keep current): ").strip()
                new_desc = input("Enter new description (press Enter to keep current, 'clear' to remove): ").strip()

                updated = app.update_task(
                    task_id,
                    title=new_title if new_title else None,
                    description="" if new_desc.lower() == "clear" else (new_desc if new_desc else None)
                )
                print(f"✅ Task updated successfully!")
                print_task(updated)
            except ValueError:
                print("❌ Error: Invalid task ID")

        elif choice == "4":
            # Delete Task
            print("\n--- Delete Task ---")
            try:
                task_id = int(input("Enter task ID to delete: ").strip())
                task = app.get_task(task_id)
                if not task:
                    print(f"❌ Error: Task #{task_id} not found")
                    continue

                print(f"Task to delete:")
                print_task(task)
                confirm = input("Are you sure? (y/n): ").strip().lower()

                if confirm == 'y':
                    app.delete_task(task_id)
                    print(f"✅ Task #{task_id} deleted successfully!")
                else:
                    print("❌ Deletion cancelled")
            except ValueError:
                print("❌ Error: Invalid task ID")

        elif choice == "5":
            # Mark Complete
            print("\n--- Mark Task Complete ---")
            try:
                task_id = int(input("Enter task ID to mark complete: ").strip())
                task = app.mark_complete(task_id)
                if task:
                    print(f"✅ Task marked as complete!")
                    print_task(task)
                else:
                    print(f"❌ Error: Task #{task_id} not found")
            except ValueError:
                print("❌ Error: Invalid task ID")

        elif choice == "6":
            # Mark Incomplete
            print("\n--- Mark Task Incomplete ---")
            try:
                task_id = int(input("Enter task ID to mark incomplete: ").strip())
                task = app.mark_incomplete(task_id)
                if task:
                    print(f"✅ Task marked as incomplete!")
                    print_task(task)
                else:
                    print(f"❌ Error: Task #{task_id} not found")
            except ValueError:
                print("❌ Error: Invalid task ID")

        elif choice == "7":
            # Exit
            print("\n👋 Thank you for using Todo Console App!")
            print("Goodbye!\n")
            sys.exit(0)

        else:
            print("❌ Invalid choice. Please enter a number between 1-7.")


if __name__ == "__main__":
    main()
