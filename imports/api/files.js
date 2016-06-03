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
                                        }]
                                    });

if (Meteor.isServer) {
    Meteor.startup(function() {
        return Files.allow({
            insert: function(userId, file) {
                var issueCheckPassed = false;

                console.log(file.metadata.author);
                console.log(file.metadata.project);
                console.log(file.metadata.issue);

                project = Projects.findOne({'_id': file.metadata.project});
                user = Meteor.users.findOne({'_id': userId});

                if (file.metadata.issue) {
                    issue = Issues.findOne({'_id': file.metadata.issue});
                    if ((issue.workflow[issue.stateIndex].stateName != 'Open')
                        && (issue.workflow[issue.stateIndex].stateName != 'Closed')
                        && (issue.workflow[issue.stateIndex].hasParticipants)
                    ) {
                        if ((issue.participants.indexOf(user.username) >= 0)
                            || issue.workflow[issue.stateIndex].openComments
                            || (issue.responsible == user.username)
                        ) {
                            issueCheckPassed = true;
                        }
                    }
                } else {
                    issueCheckPassed = true;
                }

                console.log('--> ', issueCheckPassed);

                //
                // if (user.profile.isRoot
                //     || (project.admin == user.username)
                //     || (project.pmUsers.indexOf(user.username) >= 0)
                //
                //     || stateCheckPassed
                // ) {
                //     return true;
                // }
                //
                // return false;
                return (true);
            },
            read: function(userId, file) {
                return (true);
            },
            write: function(userId, file, fields) {
                return (true);
            },
            remove: function(userId, file) {
                // issueId = file.metadata.issue.id;
                // issue = Issues.findOne({'_id': issueId});
                // user = Meteor.users.findOne({'_id': userId});
                // project = Projects.findOne({'name': issue.project});
                //
                // if (user.profile.isRoot
                //     || (project.admin == user.username)
                //     || (project.pmUsers.indexOf(user.username) >= 0)
                //     || (issue.responsible == user.username)
                // ) {
                //     return true;
                // }
                //
                // return false;
                return (true);
            },
        });
    });
}
