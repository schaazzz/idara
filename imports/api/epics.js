import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { Projects } from './projects';

export const Epics = new Mongo.Collection('epics');

if (Meteor.isServer) {
    Meteor.methods({
        'epics.insert'(project, title, descriptionHtml, descriptionMarkdown, issues, priority, responsible, attachedFiles) {
            check(project, String);
            check(title, String);
            check(descriptionHtml, String);
            check(descriptionMarkdown, String);
            check(priority, String);
            check(responsible, String);

            var thisProject = Projects.findOne({'name': project});

            if (Meteor.user().profile.isRoot
                || thisProject.noIssueFilingRestrictions
                || (Meteor.user().username == thisProject.admin)
                || (thisProject.pmUsers.indexOf(Meteor.user().username) >= 0)
            ) {
                var history = [];
                history.push({
                    type: '$epicCreated',
                    date: moment(new Date()).format('YYYY-MM-DD, HH:mm'),
                    actor: Meteor.user().username,
                    assignee: responsible});

                Epics.insert({
                    number: Epics.find({}).count() + 1,
                    project: project,
                    title: title,
                    descriptionHtml: descriptionHtml,
                    descriptionMarkdown: descriptionMarkdown,
                    priority: priority,
                    createdBy: Meteor.user().username,
                    responsible: responsible,
                    stateIndex: 0,
                    state: 'New',
                    isClosed: false,
                    createdAt: moment(new Date()).format("YYYY-MM-DD HH:mm"),
                    history: history,
                    issues: issues,
                    attachedFiles: attachedFiles,
                    progress: 0
                });
            }
        },
        'epics.update'(project, title, descriptionHtml, descriptionMarkdown, issues, priority, responsible, attachedFiles) {
        },
    });
}
