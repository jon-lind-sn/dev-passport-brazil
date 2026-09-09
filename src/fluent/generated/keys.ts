import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    bom_json: {
                        table: 'sys_module'
                        id: 'a8f77fa8afdb4b3babbc9cab49d30a58'
                    }
                    hello_world_menu: {
                        table: 'sys_app_application'
                        id: '7b41593f40874248933afb5d59f78609'
                    }
                    hello_world_module_list: {
                        table: 'sys_app_module'
                        id: '73336c4acbbb4fd6811387754f48192b'
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
                        table: 'sys_dictionary'
                        id: '3cb684bea28243fe95d3408c7bb4367f'
                        key: {
                            name: 'x_snc_dev_pass_b_hello_world'
                            element: 'NULL'
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
                        table: 'sys_dictionary'
                        id: 'a90eeb677a8d432bb202931fee2f5c0d'
                        key: {
                            name: 'x_snc_dev_pass_b_hello_world'
                            element: 'title'
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
                        table: 'ua_table_licensing_config'
                        id: 'd36fb5be006d4d1f801fc4f9687ba11a'
                        key: {
                            name: 'x_snc_dev_pass_b_hello_world'
                        }
                    },
                ]
            }
        }
    }
}
