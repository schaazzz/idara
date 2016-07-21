import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import {Projects} from '../api/projects';
import {Issues} from '../api/issues';
import { Files } from '../api/files';
import './new-issue.html';

var customFieldsRowsGlobal = new ReactiveVar();
var attachedFilesDict = new ReactiveDict('newIssueArray');
var imUploading = new ReactiveVar(false);

function parseImageSrc(imageUrl) {
    var url = imageUrl;
    var filename = url;

    var projectId = Projects.findOne({'name': activeProject.get()})._id;

    if (url.search('/') < 0) {
        var file = Files.findOne({filename: url, 'metadata.project': projectId});
        filename = url;

        if (file) {
            url = Files.baseURL + '/md5/' + file.md5;
        }
    } else {
        filename = filename.substr(filename.lastIndexOf('/') + 1);
    }

    return {
        url: url,
        filename: filename
    };
}

Template.newIssue.onDestroyed(function onDestroyed() {
    imUploading.set(false);
    Files.resumable.unAssignDrop($("#div-attach-files-to-issue"));
});

Template.newIssue.onCreated(function onCreated() {
    imUploading.set(true);
    attachedFilesDict.set('newIssueArray', []);
});

Template.newIssue.onRendered(function onRendered() {

    Files.resumable.assignBrowse($("#a-attach-file-to-issue"));
    Files.resumable.assignDrop($("#div-attach-files-to-issue"));

    if (editIssue.get()) {
        var thisIssue =  Issues.findOne({'project': activeProject.get(), 'number': parseInt(activeIssue.get())});
        this.$('#issue-title').val(thisIssue.title);
        this.$('#select-tracker').val(thisIssue.tracker);
        this.$('#select-priority').val(thisIssue.priority);
        this.$('#select-severity').val(thisIssue.severity);
        this.$('#due-date').val(thisIssue.dueDate);
        this.$('#select-responsible').val(thisIssue.responsible);
        this.$('#issue-description').val(thisIssue.descriptionMarkdown);
        attachedFilesDict.set('newIssueArray', thisIssue.attachedFiles)

        var customFieldsRows = thisIssue.customFieldsRows;

        if (customFieldsRows) {
            for (var i = 0; i < customFieldsRows.length; i++) {
                $('#' + customFieldsRows[i].first.name).val(customFieldsRows[i].first.value);

                if (customFieldsRows[i].second) {
                    $('#' + customFieldsRows[i].second.name).val(customFieldsRows[i].second.value);
                }
            }
        }
    }
});

Meteor.startup(function() {
    Files.resumable.on('fileAdded', function (file) {
        if (!imUploading.get()) {
            return;
        }

        Session.set(file.uniqueIdentifier, 0);

        var attachedFilesArray = attachedFilesDict.get('newIssueArray');
        attachedFilesArray.push(new Mongo.ObjectID(file.uniqueIdentifier));
        attachedFilesDict.set('newIssueArray', attachedFilesArray);

        return Files.insert({
            _id: file.uniqueIdentifier,
            filename: file.fileName,
            metadata: {
                author: Meteor.user()._id,
                project: Projects.findOne({'name': activeProject.get()})._id,
                epic: void 0,
                issue: void 0
            },
            contentType: file.file.type
        }, function (error, _id) {
            if (error)  {
                console.warn('File creation failed!', error);
                return;
            }

            return Files.resumable.upload();
        });
    });

    Files.resumable.on('fileProgress', function (file) {
        return Session.set(file.uniqueIdentifier, Math.floor(100 * file.progress()));
    });

    Files.resumable.on('fileSuccess', function (file) {
        return Session.set(file.uniqueIdentifier, void 0);
    });

    return Files.resumable.on('fileError', function (file) {
        return Session.set(file.uniqueIdentifier, void 0);
    });
});

Template.newIssue.helpers({
    numAttachedFiles() {
        return Files.find({
            'metadata._Resumable': {$exists: false},
            'length': {$ne: 0},
            _id: {
                $in: attachedFilesDict.get('newIssueArray')
            }
        }).count();
    },
    attachements() {
        return Files.find({
            _id: {
                $in: attachedFilesDict.get('newIssueArray')
            }
        });
    },
    link() {
        result = {path: Files.baseURL + '/md5/' + this.md5, filename: this.filename};

        if (this.filename.indexOf('_Resumable_') >= 0 ) {
            result = null;
        }

        return (result);
    },
    uploadProgress() {
        var percent = Session.get("" + this._id._str);
        var result = void 0;

        if (percent) {
            var filename = '';

            if (this.metadata._Resumable) {
                filename = this.metadata._Resumable.resumableFilename;
            } else {
                filename = this.filename;
            }

            result = 'Uploading "' + filename + '": ' + percent + '%';
        }

        return result;
    },
    project() {
        return Projects.findOne({'name': activeProject.get()});
    },
    users() {
        return Meteor.users.find({});
    },
    edit() {
        return editIssue.get();
    },
    customFieldsRows() {
        var customFields = Projects.findOne({'name': activeProject.get()}).customFields;

        if (customFields) {
            var customFieldsRowsArray = [];

            if ((Object.keys(customFields).length % 2) != 0) {
                customFields.aligner = void 0;
            }

            var row = void 0;
            for (var key in customFields) {
                var obj = void 0;
                var index = Object.keys(customFields).indexOf(key);

                if (key.indexOf('input_') == 0) {
                    obj = {
                        type: 'input',
                        name: key,
                        title: customFields[key].title
                    };
                } else if (key.indexOf('select_') == 0) {
                    var options = customFields[key].options.split(',');

                    for (var i = 0; i < options.length; i++) {
                        options[i] = options[i].replace(/^\s+/, '');
                    }
                    obj = {
                        type: 'select',
                        name: key,
                        title: customFields[key].title,
                        options: options
                    };
                } else {
                    obj = customFields.aligner;
                }

                if ((index % 2) == 0) {
                    row = {}
                    row.first = obj;
                } else {
                    row.second = obj;
                    customFieldsRowsArray.push(row);
                }
            }

            customFieldsRowsGlobal.set(customFieldsRowsArray);
            return (customFieldsRowsArray);
        } else {
            return (void 0);
        }
    },
});

Template.newIssue.events({
    'click #a-delete-file'(event, template) {
        Files.remove({'_id': this._id});
    },
    'click #btn-add-issue'(event, template) {
        var title = template.find('#issue-title').value;
        var tracker = template.find('#select-tracker').value;
        var priority = template.find('#select-priority').value;
        var responsible = template.find('#select-responsible :selected').text;
        var severity = template.find('#select-severity').value;
        var dueDate = template.find('#due-date').value;
        var description = template.find('#issue-description').value;
        var customFieldsRows = customFieldsRowsGlobal.get();

        if (customFieldsRows) {
            for (var i = 0; i < customFieldsRows.length; i++) {
                customFieldsRows[i].first.value = $('#' + customFieldsRows[i].first.name).val();

                if (customFieldsRows[i].second) {
                    customFieldsRows[i].second.value = $('#' + customFieldsRows[i].second.name).val();
                }
            }
        }

        var descriptionMarkdown = $('#issue-description').val();
        var reader = new commonmark.Parser();
        var writer = new commonmark.HtmlRenderer();

        var parsed = reader.parse(descriptionMarkdown);
        var result = writer.render(parsed);

        var tempResult = $(result);
        var outerHTML = '';
        for (i = 0; i < tempResult.length; i++) {
            if ($(tempResult[i]).find('img')[0]) {
                var imgSrc = parseImageSrc($(tempResult[i]).find('img').attr('src'));
                $(tempResult[i])
                    .html(
                        '<a href="#nolink" name="a-open-image">' +
                        $(tempResult[i])
                            .find('img')
                            .attr('src', imgSrc.url)
                            .attr('filename', imgSrc.filename)
                            .addClass('img-responsive')
                            .css('max-width', '50%')
                            .attr('align', 'middle')[0]
                            .outerHTML
                        + '</a>'
                    );
            }
        }

        for (i = 0; i < tempResult.length; i++) {
            if (tempResult[i].outerHTML) {
                outerHTML += tempResult[i].outerHTML;
            }
        }

        var descriptionHtml = outerHTML;
        var customFields = [];

        for (var i = 0; i < customFieldsRows.length; i++) {
            customFields.push(customFieldsRows[i].first);

            if (customFieldsRows[i].second) {
                customFields.push(customFieldsRows[i].second);
            }
        }

        console.log('$$$$', customFieldsRows);

        if (editIssue.get()) {
            Meteor.call('issues.update', activeProject.get(), parseInt(activeIssue.get()), title, descriptionHtml, descriptionMarkdown, tracker, priority, severity, dueDate, responsible, customFields, customFieldsRows, attachedFilesDict.get('newIssueArray'));
        } else {
            Meteor.call('issues.insert', activeProject.get(), title, descriptionHtml, descriptionMarkdown, tracker, priority, severity, dueDate, responsible, customFields, customFieldsRows, attachedFilesDict.get('newIssueArray'));
        }

        target.set('projectPage');
    }
});
