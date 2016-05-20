import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { Projects } from './projects';
import { Issues } from './issues';

export const Files = new FileCollection(
                                    'files', {
                                        resumable: true,
                                        resumableIndexName: 'test',
                                        http: [{
                                            method: 'get',
                                            path: '/md5/:md5',
                                            lookup: function (params, query) {
                                                return {
                                                    md5: params.md5
                                                };
                                            }
                                    }]});

if (Meteor.isServer) {
    Meteor.startup(function() {
        return Files.allow({
            insert: function(userId, file) {
                var ref;
                file.metadata = (ref = file.metadata) != null ? ref : {};
                file.metadata._auth = {
                    owner: userId
                };
                return true;
            },
            read: function(userId, file) {
                var ref, ref1;
                return true;
            },
            write: function(userId, file, fields) {
                var ref, ref1;
                return true;
            }
        });
    });
}
