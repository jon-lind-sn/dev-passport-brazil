import '@servicenow/sdk/global'
import { Test, TestSuite } from '@servicenow/sdk/core'

export const helloWorldRequiresTitleAndTask = Test(
    {
        $id: Now.ID['hello_world_requires_title_and_task'],
        name: 'Hello World requires Title and Task',
        description: 'Attempts to insert a Hello World record with Title and/or Task left blank and asserts each insert is rejected -- Title and Task are intended to be mandatory, so a record missing either should fail to insert',
        active: true,
        // This instance logs "Unable to find vtable operation for operation
        // id {}" as an error-level message on every GlideRecord insert (a
        // benign, pre-existing platform/integration artifact, unrelated to
        // this app or test). With failOnServerError: true, ATF fails the
        // test purely because of that noise, regardless of the actual
        // assertion outcome -- so this must stay false on this instance.
        failOnServerError: false,
    },
    (atf) => {
        const prerequisiteTask = atf.server.recordInsert({
            $id: Now.ID['insert_prerequisite_task'],
            table: 'incident',
            fieldValues: {
                short_description: 'Prerequisite task for Hello World mandatory field test',
            },
            assert: 'record_successfully_inserted',
        })

        atf.server.recordInsert({
            $id: Now.ID['insert_missing_title_and_task'],
            table: 'x_snc_dev_pass_b_hello_world',
            fieldValues: {},
            assert: 'record_not_inserted',
        })

        atf.server.recordInsert({
            $id: Now.ID['insert_missing_task'],
            table: 'x_snc_dev_pass_b_hello_world',
            fieldValues: {
                title: 'Missing Task',
            },
            assert: 'record_not_inserted',
        })

        atf.server.recordInsert({
            $id: Now.ID['insert_missing_title'],
            table: 'x_snc_dev_pass_b_hello_world',
            fieldValues: {
                task: prerequisiteTask.record_id,
            },
            assert: 'record_not_inserted',
        })
    }
)

export const devPassportBrazilRegressionSuite = TestSuite({
    $id: Now.ID['dev_passport_brazil_regression_suite'],
    name: 'Dev Passport Brazil Regression Suite',
    description: 'Regression tests for the Dev Passport Brazil app, run by the CI/CD pipeline against the test instance before publishing.',
    tests: [helloWorldRequiresTitleAndTask],
})
