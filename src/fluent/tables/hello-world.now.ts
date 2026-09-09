import '@servicenow/sdk/global'
import { Table, StringColumn, ReferenceColumn, Form, default_view } from '@servicenow/sdk/core'

export const x_snc_dev_pass_b_hello_world = Table({
    name: 'x_snc_dev_pass_b_hello_world',
    label: 'Hello World',
    display: 'title',
    schema: {
        title: StringColumn({ label: 'Title', mandatory: true }),
        task: ReferenceColumn({ label: 'Task', referenceTable: 'task' }),
        notes: StringColumn({ label: 'Notes', maxLength: 2000 }),
    },
})

Form({
    table: 'x_snc_dev_pass_b_hello_world',
    view: default_view,
    sections: [
        {
            caption: 'Details',
            content: [
                {
                    layout: 'one-column',
                    elements: [
                        { field: 'title', type: 'table_field' },
                        { field: 'task', type: 'table_field' },
                    ],
                },
            ],
        },
    ],
})
