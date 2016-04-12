import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

export const Comments = new Mongo.Collection('comments');

Meteor.methods({
    'comments.insert'(project, issue, text) {
        check(project, String);
        check(issue, Number);
        check(text, String);

        Comments.insert({
            number: Comments.find({project: project}).count() + 1,
            project: project,
            issue: issue,
            text: text,
            createdBy: Meteor.user().username,
            createdAt: moment(new Date()).format("YYYY-MM-DD HH:mm"),
        });
    },
});
