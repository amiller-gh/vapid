const Sequelize = require('sequelize');

const directives = require('../../directives');
const { Utils } = require('../../utils');

const SPECIAL_FIELDS = {
  _id: null,
  _created_at: { type: 'date', time: true },
  _updated_at: { type: 'date', time: true },
  _permalink: null,
};

/**
 * Primary object for storing content
 */
class Record extends Sequelize.Model {
  static init(sequelize, DataTypes) {
    return super.init({
      /* Attributes */
      content: {
        type: DataTypes.JSON,
        defaultValue: {},
        validate: {
          /**
            * Ensures that required fields have content values
            *
            * @param {Object} content
            * @return {Object} error messages
            */
          async fields(content) {
            const template = this.template || await this.getTemplate();
            const errors = Object.entries(template.fields).reduce((memo, [name, params]) => {
              const directive = directives.find(params);
              if (directive.attrs.required && !content[name]) {
                /* eslint-disable-next-line no-param-reassign */
                memo[name] = 'required field';
              }

              return memo;
            }, {});

            if (!Utils.isEmpty(errors)) {
              throw new Error(JSON.stringify(errors));
            }
          },
        },
      },

      metadata: {
        type: DataTypes.JSON,
        defaultValue: {},
      },

      position: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },

      template_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      slug: {
        type: DataTypes.TEXT,
        defaultValue: null,
      },

      isFirst: {
        type: DataTypes.VIRTUAL,
      },

    }, {
      sequelize,

      underscored: true,
      tableName: 'records',
      timestamps: true,

      indexes: [
        {
          unique: true,
          fields: ['slug'],
        },
      ],

      getterMethods: {

        defaultName() {
          const { template } = this;
          let defaultName = template.name === 'index' ? 'Home' : template.name;
          return this.isFirst ? defaultName : `${defaultName} ${this.id}`;
        },

        name() {
          const { template } = this;
          if (template.type === 'page') {
            return Utils.startCase(this.get('metadata').name || this.defaultName);
          }
          return Utils.startCase(this.get('metadata').name || this.get('slug') || this.defaultName);
        },

        defaultSlug() {
          const { template } = this;
          let slug = null;
          if (template.type === 'collection') {
            const name = Utils.kebabCase(this.dataValues.title || this.dataValues.name);
            slug = `${template.name}/${name ? `${name}-${this.id}` : this.id}`;
          } else if (template.type === 'page') {
            slug = this.isFirst ? template.name : `${template.name}-${this.id}`;
          }
          return slug;
        },

        safeSlug() {
          return this.getDataValue('slug') || this.defaultSlug;
        },

        /**
         * URI path to the individual record
         *
         * @return {string}
         */
        permalink() {
          let { safeSlug: slug } = this;
          if (!slug) { return slug; }
          slug = (slug === 'index') ? '' : slug;
          return `/${slug}`;
        },

        /**
         * Singularized name
         *
         * @return {string}
         */
        nameSingular() {
          return Utils.singularize(this.name);
        },
      },

      hooks: {

        /**
         * Include template, if not already specified
         * Needed by permalink getter
         *
         * @params {Object} options
         */
        beforeFind(options) {
          /* eslint-disable-next-line no-param-reassign */
          options.include = options.include || [{ all: true }];
          options.attributes = options.attributes || {};
          options.attributes.include = [[sequelize.literal('(SELECT MIN(id) == record.id FROM records WHERE template_id = template.id)'), 'isFirst']];
        },

        /**
         * Seralize/convert field values before saving to the DB
         *
         * @params {Record}
         */
        async beforeSave(record) {
          const template = record.template || await record.getTemplate();
          for (const [field, value] of Object.entries(record.content)) {
            const params = template.fields[field];
            const directive = directives.find(params);

            /* eslint-disable-next-line no-param-reassign */
            record.content[field] = directive.serialize(value);
          }

          // Save the metadata slug field in to the slug column to ensure uniqueness.
          if (record.metadata.slug) {
            record.metadata.slug = record.metadata.slug.replace(/^\/+/, '');
          }
          record.slug = record.metadata.slug;

        },
      },
    });
  }

  previewContent(fieldName, template) {
    const directive = directives.find(template.fields[fieldName]);
    const rendered = directive.preview(this.content[fieldName]);
    return rendered.length > 140 ? `${rendered.slice(0, 140)}...` : rendered;
  }

  /**
   * @static
   *
   * Removes special fields, like `_permalink` or parent template references like `general.field`
   *
   * @params {Object} fields
   * @return {Object} with special fields removed
   */
  static removeSpecialFields(fields = {}) {
    const out = {};
    for (const [key, value] of Object.entries(fields)) {
      if (key[0] === '_' || key.includes('.')) { continue; }
      out[key] = value;
    }
    return out;
  }

  /**
   * @static
   *
   * Allows modules to register callbacks
   *
   * @param {array} hooks - hook names
   * @param {function} fn - the callback
   */
  static addHooks(hooks, fn) {
    for (const hook of hooks) {
      this.addHook(hook, 'registeredHooks', fn);
    }
  }

  /**
   * @static
   *
   * Remove registered callbacks
   *
   * @params {array} hooks - hook names
   */
  static removeHooks(hooks) {
    for (const hook of hooks) {
      this.removeHook(hook, 'registeredHooks');
    }
  }
}

Record.SPECIAL_FIELDS = SPECIAL_FIELDS;

module.exports = Record;