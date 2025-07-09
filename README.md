import queue
from typing import List
from datetime import datetime


class Task:
    def __init__(
        self,
        user_email_id: str,
        file_path: str,
        filename: str,
        folder_path: str,
        create_progress_id: str,
        type_of_mail: str,
        old_folder_name: str,
        new_folder_name: str,
        queued_mail_reference: str,
        filesize: str,
        current_time: datetime,
        workspace_id: str,
        tags: List[str],
    ):
        self.user_email_id = user_email_id
        self.filename = filename
        self.file_path = file_path
        self.folder_path = folder_path
        self.create_progress_id = create_progress_id
        self.type_of_mail = type_of_mail
        self.old_folder_name = old_folder_name
        self.new_folder_name = new_folder_name
        self.queued_mail_reference = queued_mail_reference
        self.filesize = filesize
        self.current_time = current_time
        self.workspace_id = workspace_id
        self.tags = tags

    def __str__(self):
        return f"Task(user_email_id={self.user_email_id}, filename={self.filename}, file_path={self.file_path}, folder_path={self.folder_path}, create_progress_id={self.create_progress_id}, type_of_mail={self.type_of_mail}, old_folder_name={self.old_folder_name}, new_folder_name={self.new_folder_name}, queued_mail_reference={self.queued_mail_reference}, filesize={self.filesize}, current_time={self.current_time}), workspace_id={self.workspace_id}, tags={self.tags}"

    def __repr__(self):
        return f"Task(user_email_id={self.user_email_id}, filename={self.filename}, file_path={self.file_path}, folder_path={self.folder_path}, create_progress_id={self.create_progress_id}, type_of_mail={self.type_of_mail}, old_folder_name={self.old_folder_name}, new_folder_name={self.new_folder_name}, queued_mail_reference={self.queued_mail_reference}, filesize={self.filesize}, current_time={self.current_time}), workspace_id={self.workspace_id}, tags={self.tags}"


class QueueManager:
    _instance = None

    def __init__(self):
        if QueueManager._instance is not None:
            raise Exception("This class is a singleton!")
        self.queues = {}

    @staticmethod
    def get_instance():
        if QueueManager._instance is None:
            QueueManager._instance = QueueManager()
        return QueueManager._instance

    def get_queue(self, workspace_id):
        if workspace_id not in self.queues:
            self.queues[workspace_id] = queue.Queue()
        return self.queues[workspace_id]

    def process_one_task_by_user(self, workspace_id):
        if workspace_id in self.queues:
            user_queue = self.queues[workspace_id]
            if not user_queue.empty():
                task = user_queue.get()
                return task
            else:
                del self.queues[workspace_id]

        return None

    def process_task_by_user_and_id(self, workspace_id, queued_mail_reference):
        if workspace_id not in self.queues:
            return None

        user_queue = self.queues[workspace_id]
        if user_queue.empty():
            return None

        all_tasks = []
        target_task = None

        while not user_queue.empty():
            task = user_queue.get()
            if (
                task.queued_mail_reference == queued_mail_reference
                and target_task is None
            ):
                target_task = task
            else:
                all_tasks.append(task)

        for task in all_tasks:
            user_queue.put(task)

        if target_task:
            return target_task
        else:
            return None


def add_task(
    user_email_id: str,
    file_path: str,
    filename: str,
    folder_path: str,
    create_progress_id: str,
    type_of_mail: str,
    old_folder_name: str,
    new_folder_name: str,
    queued_mail_reference: str,
    filesize: str,
    current_time: datetime,
    workspace_id: str,
    tags: List[str],
):
    task = Task(
        user_email_id=user_email_id,
        file_path=file_path,
        filename=filename,
        folder_path=folder_path,
        create_progress_id=create_progress_id,
        type_of_mail=type_of_mail,
        old_folder_name=old_folder_name,
        new_folder_name=new_folder_name,
        queued_mail_reference=queued_mail_reference,
        filesize=filesize,
        current_time=current_time,
        workspace_id=workspace_id,
        tags=tags,
    )
    manager = QueueManager.get_instance()
    user_queue = manager.get_queue(workspace_id=workspace_id)
    user_queue.put(task)
