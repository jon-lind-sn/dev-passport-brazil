import { gs, GlideRecord } from '@servicenow/glide'

export function rejectInactiveTask(current: GlideRecord<'x_snc_dev_pass_b_hello_world'>, previous: GlideRecord<'x_snc_dev_pass_b_hello_world'>) {
    gs.addErrorMessage('Hello World records must reference an active Task.')
    current.setAbortAction(true)
}
