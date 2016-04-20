import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { Projects } from './projects';
import { Issues } from './issues';

export const Comments = new Mongo.Collection('comments');

Meteor.methods({
    'comments.insert'(project, issue, state, text) {
        check(project, String);
        check(issue, Number);
        check(state, Number);
        check(text, String);

        var thisIssue = Issues.findOne({'project': project, 'number': issue});
        var thisProject = Projects.findOne({'name': project});
        var workflow = thisProject.workflow;

        if (workflow[state].openComments || (thisIssue.participants[state].indexOf(Meteor.user().username) >= 0))
        {
            Comments.insert({
                number: Comments.find({project: project}).count() + 1,
                project: project,
                issue: issue,
                state: state,
                text: text,
                createdBy: Meteor.user().username,
                createdAt: moment(new Date()).format("YYYY-MM-DD HH:mm"),
            });
        } else {
            throw new Meteor.Error('not-authorized');
        }
    },
});
