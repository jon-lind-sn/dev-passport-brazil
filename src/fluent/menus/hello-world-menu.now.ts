import '@servicenow/sdk/global'
import { ApplicationMenu, Record } from '@servicenow/sdk/core'

const helloWorldMenu = ApplicationMenu({
    $id: Now.ID['hello_world_menu'],
    title: 'Hello World',
    hint: 'Tasks I am interested in',
    description: 'Tracks references to tasks of interest',
    active: true,
})

Record({
    $id: Now.ID['hello_world_module_list'],
    table: 'sys_app_module',
    data: {
        title: 'Hello World',
        application: helloWorldMenu,
        link_type: 'LIST',
        name: 'x_snc_dev_pass_b_hello_world',
        hint: 'View Hello World records',
        active: true,
        order: 100,
    },
})
