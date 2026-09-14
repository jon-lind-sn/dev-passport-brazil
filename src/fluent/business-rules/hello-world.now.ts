import '@servicenow/sdk/global'
import { BusinessRule } from '@servicenow/sdk/core'
import { rejectInactiveTask } from '../../server/business-rules/reject-inactive-task'

export const helloWorldRejectsInactiveTaskRule = BusinessRule({
    $id: Now.ID['hello_world_rejects_inactive_task_rule'],
    name: 'Reject inactive Task on Hello World',
    table: 'x_snc_dev_pass_b_hello_world',
    when: 'before',
    active: false,
    action: ['insert'],
    filterCondition: 'task.active=false',
    script: rejectInactiveTask,
})
