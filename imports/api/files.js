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

                var project = Projects.findOne({'_id': file.metadata.project});
                var user = Meteor.users.findOne({'_id': userId});

                if (file.metadata.issue) {
                    var issue = Issues.findOne({'_id': file.metadata.issue});
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

                if (user.profile.isRoot
                    || (project.admin == user.username)
                    || (project.pmUsers.indexOf(user.username) >= 0)
                    || project.noIssueFilingRestrictions
                    || stateCheckPassed
                ) {
                    return true;
                }

                return false;
            },
            read: function(userId, file) {
                return (true);
            },
            write: function(userId, file, fields) {
                return (true);
            },
            remove: function(userId, file) {
                var issueId = file.metadata.issue;
                var issue = Issues.findOne({'_id': issueId});
                var user = Meteor.users.findOne({'_id': userId});
                var project = Projects.findOne({'_id': file.metadata.project});

                if (user.profile.isRoot
                    || userId == file.metadata.author
                    || (project.admin == user.username)
                    || (project.pmUsers.indexOf(user.username) >= 0)
                    || (issue
                        && (issue.responsible == user.username))
                ) {
                    return true;
                }

                return false;
            },
        });
    });
}
