import mongoose, { Schema, Document } from 'mongoose';

export interface IJobResult extends Document {
  job_id: string;
  status: string;
  task_type: string;
  audit?: any;
  preprocessing?: any;
  supervised_results?: any;
  unsupervised_results?: any;
  dl_results?: any;
  created_at: Date;
}

const JobResultSchema: Schema = new Schema({
  job_id: { type: String, required: true, unique: true },
  status: { type: String, required: true },
  task_type: { type: String },
  audit: { type: Schema.Types.Mixed },
  preprocessing: { type: Schema.Types.Mixed },
  supervised_results: { type: Schema.Types.Mixed },
  unsupervised_results: { type: Schema.Types.Mixed },
  dl_results: { type: Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model<IJobResult>('JobResult', JobResultSchema);
