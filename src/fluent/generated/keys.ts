import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    assert_title_and_task_required: {
                        table: 'sys_atf_step'
                        id: 'd32374f94d18419093f4bdd54ee3c43e'
                        deleted: true
                    }
                    bom_json: {
                        table: 'sys_module'
                        id: 'a8f77fa8afdb4b3babbc9cab49d30a58'
                    }
                    dev_passport_brazil_regression_suite: {
                        table: 'sys_atf_test_suite'
                        id: 'd8bac3457a914d568c7d013a582c6597'
                    }
                    hello_world_mandatory_fields_policy: {
                        table: 'sys_data_policy2'
                        id: '8c139a1ee53d4f5097d693658d86b68d'
                    }
                    hello_world_mandatory_fields_policy_task_rule: {
                        table: 'sys_data_policy_rule'
                        id: 'af3a117ba2d247ec8a66e5aa77be3a65'
                    }
                    hello_world_mandatory_fields_policy_title_rule: {
                        table: 'sys_data_policy_rule'
                        id: '1f955aab4f954c928f7bb3aa59a8742d'
                    }
                    hello_world_menu: {
                        table: 'sys_app_application'
                        id: '7b41593f40874248933afb5d59f78609'
                    }
                    hello_world_module_list: {
                        table: 'sys_app_module'
                        id: '73336c4acbbb4fd6811387754f48192b'
                    }
                    hello_world_requires_title_and_task: {
                        table: 'sys_atf_test'
                        id: 'ac35b3b6cf3c48b0a8591b2a793eeda6'
                    }
                    insert_missing_task: {
                        table: 'sys_atf_step'
                        id: '3ba5bd4541e54429b6126423dfb1f90f'
                        deleted: false
                    }
                    insert_missing_title: {
                        table: 'sys_atf_step'
                        id: '62ad0366aef24b4481c4dd50a6621ceb'
                        deleted: false
                    }
                    insert_missing_title_and_task: {
                        table: 'sys_atf_step'
                        id: '09c52cdc638c44289db4420dd06c5c31'
                        deleted: false
                    }
                    insert_prerequisite_task: {
                        table: 'sys_atf_step'
                        id: 'f2078d3fa2024a79b2799df4153d8272'
                        deleted: false
                    }
                    package_json: {
                        table: 'sys_module'
                        id: '415b75cbdbb64090ba136c5909fb4fe0'
                    }
                }
                composite: [
                    {
                        table: 'sys_documentation'
                        id: '002e46d31f0147a8a1bdaa8f5266bd3b'
                        key: {
                            name: 'x_snc_dev_pass_b_hello_world'
                            element: 'task'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_element_mapping'
                        id: '0e51a3bae63447018389d05d436081d8'
                        deleted: false
                        key: {
                            field: 'field_values'
                            table: 'var__m_atf_input_variable_14872288df60220062fe6c7a4df26319'
                            id: '62ad0366aef24b4481c4dd50a6621ceb'
                        }
                    },
                    {
                        table: 'sys_variable_value'
                        id: '107d1df5c78d4106a2288a2b71643d78'
                        deleted: false
                        key: {
                            document_key: '62ad0366aef24b4481c4dd50a6621ceb'
                            variable: '9024a37f671003007ba405225685efe5'
                        }
                    },
                    {
                        table: 'sys_ui_form_section'
                        id: '123726904cf043b998dc6e87800c06ba'
                        key: {
                            sys_ui_form: {
                                id: '9270760c8cd84147a0668cf8a1e36e83'
                                key: {
                                    name: 'x_snc_dev_pass_b_hello_world'
                                    view: {
                                        id: 'Default view'
                                        key: {
                                            name: 'NULL'
                                        }
                                    }
                                    sys_domain: 'global'
                                }
                            }
                            sys_ui_section: {
                                id: '62a04a4e941f4d5f953e7fa1162a6aae'
                                key: {
                                    name: 'x_snc_dev_pass_b_hello_world'
                                    caption: 'Details'
                                    view: {
                                        id: 'Default view'
                                        key: {
                                            name: 'NULL'
                                        }
                                    }
                                    sys_domain: 'global'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '197490182f274b778f038f09802bef30'
                        key: {
                            name: 'x_snc_dev_pass_b_hello_world'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_variable_value'
                        id: '1c8626631a404cc4a3303f255c86cf4a'
                        deleted: true
                        key: {
                            document_key: 'd32374f94d18419093f4bdd54ee3c43e'
                            variable: '42f2564b73031300440211d8faf6a777'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '279984c894a1418a9d7eb3a18999e664'
                        key: {
                            name: 'x_snc_dev_pass_b_hello_world'
                            element: 'task'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '293d2420eafb4f35be69d1d99a32ef92'
                        key: {
                            name: 'x_snc_dev_pass_b_hello_world'
                        }
                    },
                    {
                        table: 'sys_variable_value'
                        id: '297b5fe3b2204e6686e2a095f0d09847'
                        deleted: true
                        key: {
                            document_key: 'd32374f94d18419093f4bdd54ee3c43e'
                            variable: '989d9e235324220002c6435723dc3484'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3cb684bea28243fe95d3408c7bb4367f'
                        key: {
                            name: 'x_snc_dev_pass_b_hello_world'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_variable_value'
                        id: '51abe38956444c52b3b3b681375ba880'
                        deleted: false
                        key: {
                            document_key: '09c52cdc638c44289db4420dd06c5c31'
                            variable: 'e6e3c7535320220002c6435723dc3496'
                        }
                    },
                    {
                        table: 'sys_element_mapping'
                        id: '538ebf65b78e4245a72584516e0fbb15'
                        deleted: true
                        key: {
                            field: 'script'
                            table: 'var__m_atf_input_variable_41de4a935332120028bc29cac2dc349a'
                            id: 'd32374f94d18419093f4bdd54ee3c43e'
                        }
                    },
                    {
                        table: 'sys_variable_value'
                        id: '5a48e3cac256418ca59a7307dd624d0c'
                        deleted: false
                        key: {
                            document_key: '09c52cdc638c44289db4420dd06c5c31'
                            variable: '90144b535320220002c6435723dc3488'
                        }
                    },
                    {
                        table: 'sys_ui_section'
                        id: '62a04a4e941f4d5f953e7fa1162a6aae'
                        key: {
                            name: 'x_snc_dev_pass_b_hello_world'
                            caption: 'Details'
                            view: {
                                id: 'Default view'
                                key: {
                                    name: 'NULL'
                                }
                            }
                            sys_domain: 'global'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '65fd75dad9f04c1cb0ffa440894bd3e6'
                        key: {
                            name: 'x_snc_dev_pass_b_hello_world'
                            element: 'title'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_variable_value'
                        id: '737ea8f0d4884c258185de721230cf2f'
                        deleted: false
                        key: {
                            document_key: '62ad0366aef24b4481c4dd50a6621ceb'
                            variable: '90144b535320220002c6435723dc3488'
                        }
                    },
                    {
                        table: 'sys_atf_test_suite_test'
                        id: '7eec4a5fa54347b681859184a83b618a'
                        key: {
                            test_suite: 'd8bac3457a914d568c7d013a582c6597'
                            test: 'ac35b3b6cf3c48b0a8591b2a793eeda6'
                        }
                    },
                    {
                        table: 'sys_variable_value'
                        id: '7fe6dd9829a549fbb45c60ef974039c2'
                        deleted: false
                        key: {
                            document_key: '09c52cdc638c44289db4420dd06c5c31'
                            variable: 'dd54cf535320220002c6435723dc34fd'
                        }
                    },
                    {
                        table: 'sys_ui_element'
                        id: '827fe51b84f446fa8992e27010fc0e95'
                        key: {
                            sys_ui_section: {
                                id: '62a04a4e941f4d5f953e7fa1162a6aae'
                                key: {
                                    name: 'x_snc_dev_pass_b_hello_world'
                                    caption: 'Details'
                                    view: {
                                        id: 'Default view'
                                        key: {
                                            name: 'NULL'
                                        }
                                    }
                                    sys_domain: 'global'
                                }
                            }
                            element: 'title'
                            position: '0'
                        }
                    },
                    {
                        table: 'sys_variable_value'
                        id: '82ef5e8b6a02497cb61812a2653c29f4'
                        deleted: false
                        key: {
                            document_key: '62ad0366aef24b4481c4dd50a6621ceb'
                            variable: 'e6e3c7535320220002c6435723dc3496'
                        }
                    },
                    {
                        table: 'sys_ui_form'
                        id: '9270760c8cd84147a0668cf8a1e36e83'
                        key: {
                            name: 'x_snc_dev_pass_b_hello_world'
                            view: {
                                id: 'Default view'
                                key: {
                                    name: 'NULL'
                                }
                            }
                            sys_domain: 'global'
                        }
                    },
                    {
                        table: 'sys_variable_value'
                        id: '980f988da0294bfb8b704b8b9ddd5e12'
                        deleted: false
                        key: {
                            document_key: '3ba5bd4541e54429b6126423dfb1f90f'
                            variable: 'dd54cf535320220002c6435723dc34fd'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a90eeb677a8d432bb202931fee2f5c0d'
                        key: {
                            name: 'x_snc_dev_pass_b_hello_world'
                            element: 'title'
                        }
                    },
                    {
                        table: 'sys_variable_value'
                        id: 'ba60e73598824181a3b7fdba581b0f79'
                        deleted: false
                        key: {
                            document_key: '62ad0366aef24b4481c4dd50a6621ceb'
                            variable: 'dd54cf535320220002c6435723dc34fd'
                        }
                    },
                    {
                        table: 'sys_ui_element'
                        id: 'bbad83e98e8e400eae90a473f4793173'
                        key: {
                            sys_ui_section: {
                                id: '62a04a4e941f4d5f953e7fa1162a6aae'
                                key: {
                                    name: 'x_snc_dev_pass_b_hello_world'
                                    caption: 'Details'
                                    view: {
                                        id: 'Default view'
                                        key: {
                                            name: 'NULL'
                                        }
                                    }
                                    sys_domain: 'global'
                                }
                            }
                            element: 'task'
                            position: '1'
                        }
                    },
                    {
                        table: 'sys_variable_value'
                        id: 'c255b95308e04c15a47e8a16f3fb691c'
                        deleted: false
                        key: {
                            document_key: '3ba5bd4541e54429b6126423dfb1f90f'
                            variable: 'e6e3c7535320220002c6435723dc3496'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'd36fb5be006d4d1f801fc4f9687ba11a'
                        key: {
                            name: 'x_snc_dev_pass_b_hello_world'
                        }
                    },
                    {
                        table: 'sys_variable_value'
                        id: 'd464fe51d39c4dc9a96b9b1d3cacc8a9'
                        deleted: false
                        key: {
                            document_key: '09c52cdc638c44289db4420dd06c5c31'
                            variable: '9024a37f671003007ba405225685efe5'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'df8c2297dab54ffbb16a36e587317b9d'
                        key: {
                            name: 'x_snc_dev_pass_b_hello_world'
                            element: 'notes'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_variable_value'
                        id: 'e38112e4209e4d98a1915449d3d48892'
                        deleted: false
                        key: {
                            document_key: '3ba5bd4541e54429b6126423dfb1f90f'
                            variable: '90144b535320220002c6435723dc3488'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ecfef43943b34b4fa18859a01536edc1'
                        key: {
                            name: 'x_snc_dev_pass_b_hello_world'
                            element: 'notes'
                        }
                    },
                    {
                        table: 'sys_variable_value'
                        id: 'ed90a5b547de4e15bb135edb82ae88de'
                        deleted: false
                        key: {
                            document_key: 'f2078d3fa2024a79b2799df4153d8272'
                            variable: 'dd54cf535320220002c6435723dc34fd'
                        }
                    },
                    {
                        table: 'sys_variable_value'
                        id: 'edbbdf0ade6d4b59ae5f0b5baaa4bf28'
                        deleted: false
                        key: {
                            document_key: 'f2078d3fa2024a79b2799df4153d8272'
                            variable: 'e6e3c7535320220002c6435723dc3496'
                        }
                    },
                    {
                        table: 'sys_variable_value'
                        id: 'f06d32006b4f4c2786449e49a604e0de'
                        deleted: false
                        key: {
                            document_key: 'f2078d3fa2024a79b2799df4153d8272'
                            variable: '9024a37f671003007ba405225685efe5'
                        }
                    },
                    {
                        table: 'sys_variable_value'
                        id: 'f48a47245df445958733047d1b9673ba'
                        deleted: false
                        key: {
                            document_key: 'f2078d3fa2024a79b2799df4153d8272'
                            variable: '90144b535320220002c6435723dc3488'
                        }
                    },
                    {
                        table: 'sys_variable_value'
                        id: 'f62ec8250a6d4ea2885a3d1b2b84901b'
                        deleted: false
                        key: {
                            document_key: '3ba5bd4541e54429b6126423dfb1f90f'
                            variable: '9024a37f671003007ba405225685efe5'
                        }
                    },
                ]
            }
        }
    }
}
