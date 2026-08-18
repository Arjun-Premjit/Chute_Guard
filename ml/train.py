"""
Prototype training pipeline.
CSV columns: level_pct,vibration_rms,weight_kg,flow_rate,inlet_flow,outlet_flow,blocked
"""
import pandas as pd, joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score

df=pd.read_csv("data/chute_training.csv")
features=["level_pct","vibration_rms","weight_kg","flow_rate","inlet_flow","outlet_flow"]
X=df[features]; y=df["blocked"].astype(int)
Xtr,Xte,ytr,yte=train_test_split(X,y,test_size=.2,stratify=y,random_state=42)
model=RandomForestClassifier(n_estimators=300,max_depth=10,class_weight="balanced",random_state=42).fit(Xtr,ytr)
p=model.predict_proba(Xte)[:,1]
print(classification_report(yte,(p>=.5).astype(int)))
print("ROC-AUC:",roc_auc_score(yte,p))
joblib.dump(model,"model/chuteguard_rf.joblib")
