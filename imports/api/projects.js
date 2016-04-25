import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

export const Projects = new Mongo.Collection('projects');

Meteor.methods({
    'projects.insert'(name, description, admin) {
        check(name, String);
        check(description, String);
        check(admin, String);

        workflow = [{
            stateName: 'Open',
            nextState: '$fixed:Review',
        }, {
            stateName:'Review',
            hasParticipants: true,
            participantsRole: 'Reviewer',
            nextState: '$fixed:CCB',
            autoStateChange: false,
            openComments: true
        }, {
            stateName:'CCB',
            hasParticipants: true,
            participantsRole: 'Reviewer',
            nextState: '$prompt:Implementation,Closed',
            autoStateChange: false,
            openComments: false,
        }, {
            stateName:'Implementation',
            hasParticipants: true,
            participantsRole: 'Developer',
            nextState: '$fixed:Test',
            autoStateChange: false,
            openComments: false,
        }, {
            stateName:'Test',
            hasParticipants: true,
            participantsRole: 'Tester',
            nextState: '$fixed:Closed',
            autoStateChange: false,
            openComments: false,
        }, {
            stateName: 'Closed',
            nextState: '$none'
        }];

        if (Meteor.user().profile.isRoot) {
            Projects.insert({
                name: name,
                description: description,
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
    'projects.update'(_id, name, description, admin, pmUsers) {
        check(_id, String);
        check(name, String);
        check(description, String);
        check(admin, String);
        check(pmUsers, [String]);

        thisProject = Projects.findOne({'_id': _id});

        if (Meteor.user().profile.isRoot || (Meteor.user().username == thisProject.admin)) {
            Projects.update(
                {'_id': _id},
                {$set: {'name': name, 'description': description, 'admin': admin, 'pmUsers': pmUsers}});
        } else {
            throw new Meteor.Error('not-authorized');
        }
    }
});
