<?php

return [

    // Global ceiling for assignments.max_file_size_mb (PRD §5.17). PHP upload_max_filesize,
    // post_max_size and Nginx client_max_body_size must be set slightly above this.
    'max_upload_mb' => (int) env('LMS_MAX_UPLOAD_MB', 50),

    // Submission file whitelist (PRD FR-03). assignments.allowed_extensions is a subset of it.
    'submission_extensions' => ['pdf', 'zip', 'rar', 'doc', 'docx', 'ppt', 'pptx', 'png', 'jpg', 'jpeg'],

];
