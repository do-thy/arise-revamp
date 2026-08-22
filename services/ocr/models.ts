/**
 * Bundled PaddleOCR ONNX model references.
 *
 * Place these files in `assets/models/` (see CHANGELOG manual actions). Metro resolves
 * them to asset ids thanks to the `*.onnx` ambient module declaration and the `onnx`
 * entry in metro.config.js assetExts.
 */
import detModel from '../../assets/models/det_model.onnx';
import recModel from '../../assets/models/rec_model.onnx';
import clsModel from '../../assets/models/cls_model.onnx';

export const PADDLE_OCR_MODELS = {
  det: detModel,
  rec: recModel,
  cls: clsModel,
} as const;
