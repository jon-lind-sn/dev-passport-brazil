import '@servicenow/sdk/global'
import { DataPolicy } from '@servicenow/sdk/core'

export const helloWorldMandatoryFieldsPolicy = DataPolicy({
    $id: Now.ID['hello_world_mandatory_fields_policy'],
    table: 'x_snc_dev_pass_b_hello_world',
    shortDescription: 'Require Title and Task on Hello World records',
    rules: {
        title: { $id: Now.ID['hello_world_mandatory_fields_policy_title_rule'], mandatory: true },
        task: { $id: Now.ID['hello_world_mandatory_fields_policy_task_rule'], mandatory: true },
    },
})
