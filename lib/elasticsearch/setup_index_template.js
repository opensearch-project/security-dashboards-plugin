import Promise from 'bluebird';
import elasticsearch from 'elasticsearch';

export default function (plugin, server) {

    const callAdminAsKibanaUser = server.plugins.elasticsearch.getCluster('admin').callWithInternalUser;
    const index = server.config().get('kibana.index');
    const migrator = server.kibanaMigrator;

    function waitForElasticsearchGreen() {
        return new Promise((resolve) => {
            server.plugins.elasticsearch.status.once('green', resolve);
        });
    }

    async function setupIndexTemplate() {
        const adminCluster = server.plugins.elasticsearch.getCluster('admin');
        try {
            await callAdminAsKibanaUser('indices.putTemplate', {
                name: `tenant_template`,
                body: {
                    index_patterns: [
                        index+"_-*_*",
                        index+"_0*_*",
                        index+"_1*_*",
                        index+"_2*_*",
                        index+"_3*_*",
                        index+"_4*_*",
                        index+"_5*_*",
                        index+"_6*_*",
                        index+"_7*_*",
                        index+"_8*_*",
                        index+"_9*_*",
                    ],
                    settings: {
                        number_of_shards: 1,
                    },
                    mappings: migrator.getActiveMappings(),
                },
            });
        } catch (error) {
            server.log(['debug', 'setupIndexTemplate'], {
                tmpl: 'Error setting up indexTemplate for SavedObjects: <%= err.message %>',
                es: {
                    resp: error.body,
                    status: error.status,
                },
                err: {
                    message: error.message,
                    stack: error.stack,
                },
            });
            throw new adminCluster.errors.ServiceUnavailable();
        }
    }

    return {
        setupIndexTemplate: setupIndexTemplate,
        waitForElasticsearchGreen: waitForElasticsearchGreen
    };

}
