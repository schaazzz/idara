import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import {Projects} from '../api/projects.js';
import {Issues} from '../api/issues.js';
import {Comments} from '../api/comments.js';
import './issue-page.html';

Template.issuePage.onRendered(function onRendered() {
});

Template.issuePage.helpers({
    issue() {
        thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        thisIssue.startDate = moment(new Date(thisIssue.createdAt)).format('YYYY-MM-DD');
        return thisIssue;
    },
    comments() {
        return Comments.find({'project': activeProject.get(), 'issue': parseInt(activeIssue.get())});
    }
});

Template.issuePage.events({
    'click [id=btn-add-comment]'(event, template) {
        Meteor.call('comments.insert', activeProject.get(), parseInt(activeIssue.get()), $('#txt-comment').val());
        $('#txt-comment').val('');
        $('#div-comment').removeClass('in');
    }
});
