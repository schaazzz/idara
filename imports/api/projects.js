import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { Workflows } from './workflows';

export const Projects = new Mongo.Collection('projects');

Meteor.methods({
    'projects.insert'(name, description, admin, workflow) {
        check(name, String);
        check(description, String);
        check(admin, String);
        check(workflow, String);

        workflow = Workflows.findOne({'name': workflow}).states;

        if (Meteor.user().profile.isRoot) {
            Projects.insert({
                name: name,
                description: description,
                noIssueFilingRestrictions: false,
                admin: admin,
                pmUsers: [],
                workflow: workflow,
                createdAt: new Date(),
                createdBy: Meteor.user().username,
            });
        } else {
            throw new Meteor.Error('not-authorized');
        }
    },
    'projects.update'(_id, name, description, admin, pmUsers, noIssueFilingRestrictions) {
        check(_id, String);
        check(name, String);
        check(description, String);
        check(admin, String);
        check(pmUsers, [String]);
        check(noIssueFilingRestrictions, Boolean);

        thisProject = Projects.findOne({'_id': _id});

        if (Meteor.user().profile.isRoot || (Meteor.user().username == thisProject.admin)) {
            Projects.update(
                {'_id': _id},
                {$set: {
                    'name': name,
                    'description': description,
                    'admin': admin,
                    'pmUsers': pmUsers,
                    'noIssueFilingRestrictions': noIssueFilingRestrictions
                }}
            );
        } else {
            throw new Meteor.Error('not-authorized');
        }
    }
});
