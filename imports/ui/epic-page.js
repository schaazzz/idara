import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Projects } from '../api/projects';
import { Epics } from '../api/epics';
import { Issues } from '../api/issues';
import { Files } from '../api/files';
import './epic-page.html';

var attachedFilesDict = new ReactiveDict('epicPageArray');

Template.epicPage.onCreated(function onCreated() {
    var thisEpic = Epics.findOne({'number': parseInt(activeEpic.get()), 'project': activeProject.get()});
    attachedFilesDict.set('epicPageArray', []);
    attachedFilesDict.set('epicPageArray', thisEpic.attachedFiles);
});

Template.epicPage.onRendered(function onRendered() {

});

Template.epicPage.helpers({
    epic() {
        var thisEpic = Epics.findOne({'number': parseInt(activeEpic.get()), 'project': activeProject.get()});
        thisEpic.createdAt = moment(thisEpic.createdAt).format('YYYY-MM-DD');
        thisEpic.numIssues = thisEpic.issues.length;
        return (thisEpic);
    },
    epicIssues() {
        var thisEpic = Epics.findOne({'number': parseInt(activeEpic.get()), 'project': activeProject.get()});
        var issues = Issues.find({'project': activeProject.get(), 'number': {$in: thisEpic.issues}});
        return (issues);
    }
});

Template.epicPage.events({
    'click #a-edit-issue'(event, template) {
        editEpic.set(true);
        target.set('newEpic');
    }
});
