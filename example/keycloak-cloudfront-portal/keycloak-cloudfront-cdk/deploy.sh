set -e

function help
{
echo '
Usage deploy.sh OPTIONS

deploy keycloak-cloudfront infrastructure

Options:
  -n,    --name REQUIRED  uniq id
  -r, --role    REQUIRED  arnRole
  --profile               aws profile
  --help                  Help screen
'
}

POSITIONAL=()
while [[ $# -gt 0 ]]
do
key="$1"

case $key in
    -n|--name)
    BUCKET_NAME="$2"
    shift
    shift
    ;;
   -r|--role)
    ROLE="$2"
    shift
    shift
    ;;
   -profile)
    PROFILE="$2"
    shift
    shift
    ;;
    --help)
    help
    exit
    ;;
    *)    # unknown option
    POSITIONAL+=("$1") # save it in an array for later
    shift # past argument
    ;;
esac
done

set -- "${POSITIONAL[@]}" # restore positional parameters

if [[ "x${BUCKET_NAME}" = "x" ]]; then
  echo "Error: bucket name is required"
  help
  exit 1;
fi

if [[ "x${ROLE}" = "x" ]]; then
  echo "Error: Arn Role is required"
  help
  exit 1;
fi
#npm i aws-cdk -g
#npm i
#npm run build
export AWS_DEFAULT_REGION=us-east-1
#export stackName="example-${BUCKET_NAME}"
export bucketName="${BUCKET_NAME}"
export arnRole="${ROLE}"

if [[ "x${PROFILE}" = "x" ]]; then
    cdk -v bootstrap
    cdk -v deploy
    exit 0;
fi

cdk -v bootstrap --profile="${PROFILE}"
cdk -v deploy --profile="${PROFILE}"

