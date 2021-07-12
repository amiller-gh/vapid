import { NeutrinoHelper } from './types';

const ImageHelper: NeutrinoHelper = {
  isField: true,
  isBranch: false,
  getType() { return 'image'; },
  run([image], _hash, options) {
    if (!image) { return options.inverse ? options.inverse() : ''; }
    return image ? options.block?.([image]) : '';
  },
};

export default ImageHelper;